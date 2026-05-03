<?php

function searchClientUsers($conn, $query) {
    $search = "%" . $query . "%";

    $sql = "
        SELECT
            user_id,
            first_name,
            last_name,
            phone_number,
            email
        FROM users
        WHERE role = 'client'
          AND (
            first_name LIKE ?
            OR last_name LIKE ?
            OR phone_number LIKE ?
            OR CONCAT(first_name, ' ', last_name) LIKE ?
          )
        LIMIT 10
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        return [];
    }

    $stmt->bind_param("ssss", $search, $search, $search, $search);
    $stmt->execute();

    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

function searchClients($conn, $query) {
    $rows = searchClientUsers($conn, $query);
    $clients = [];

    foreach ($rows as $row) {
        $clients[] = [
            "id" => (int) $row["user_id"],
            "name" => trim($row["first_name"] . " " . $row["last_name"]),
            "phone" => $row["phone_number"],
            "email" => $row["email"]
        ];
    }

    return $clients;
}

function searchCarModels($conn, $query) {
    $search = "%" . $query . "%";

    $sql = "
        SELECT
            id,
            company_name,
            car_name,
            engines,
            capacity,
            horsepower,
            total_speed,
            performance,
            fuel_type,
            seats,
            torque
        FROM carsmodels
        WHERE company_name LIKE ?
           OR car_name LIKE ?
           OR CONCAT(company_name, ' ', car_name) LIKE ?
        LIMIT 10
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        return [];
    }

    $stmt->bind_param("sss", $search, $search, $search);
    $stmt->execute();

    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

function searchJobs($conn, $query) {
    $search = "%" . $query . "%";

    $sql = "
        SELECT
            j.job_id,
            j.status,
            j.updated_at,
            v.plate_number,
            CONCAT(client_user.first_name, ' ', client_user.last_name) AS client_name,
            CONCAT(staff_user.first_name, ' ', staff_user.last_name) AS staff_name
        FROM jobs j
        LEFT JOIN vehicles v ON v.vehicle_id = j.vehicle_id
        LEFT JOIN users client_user ON client_user.user_id = j.client_id
        LEFT JOIN users staff_user ON staff_user.user_id = j.staff_id
        WHERE v.plate_number LIKE ?
           OR CONCAT(client_user.first_name, ' ', client_user.last_name) LIKE ?
           OR CONCAT(staff_user.first_name, ' ', staff_user.last_name) LIKE ?
           OR j.status LIKE ?
        ORDER BY j.updated_at DESC
        LIMIT 30
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        return [];
    }

    $stmt->bind_param("ssss", $search, $search, $search, $search);
    $stmt->execute();

    $jobs = [];
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $mechanics = [];

        if ($row["staff_name"]) {
            $mechanics[] = $row["staff_name"];
        }

        $jobs[] = [
            "id" => (int) $row["job_id"],
            "code" => $row["plate_number"],
            "client" => $row["client_name"],
            "mechanicsLabel" => "Mekaniket",
            "mechanics" => $mechanics,
            "dateLabel" => "Data",
            "date" => $row["updated_at"],
            "status" => $row["status"]
        ];
    }

    return $jobs;
}

function searchStaffMembers($conn, $query) {
    $search = "%" . $query . "%";
    $staff = [];

    $sql = "
        SELECT DISTINCT
            staff_user.user_id,
            staff_user.first_name,
            staff_user.last_name,
            staff_user.role,
            staff_user.login_identifier
        FROM users staff_user
        LEFT JOIN jobs j ON j.staff_id = staff_user.user_id
        LEFT JOIN vehicles v ON v.vehicle_id = j.vehicle_id
        LEFT JOIN users client_user ON client_user.user_id = j.client_id
        WHERE staff_user.role = 'staff'
          AND (
            staff_user.first_name LIKE ?
            OR staff_user.last_name LIKE ?
            OR staff_user.login_identifier LIKE ?
            OR CONCAT(staff_user.first_name, ' ', staff_user.last_name) LIKE ?
            OR v.plate_number LIKE ?
            OR CONCAT(client_user.first_name, ' ', client_user.last_name) LIKE ?
          )
        ORDER BY staff_user.first_name, staff_user.last_name
        LIMIT 30
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        return [];
    }

    $stmt->bind_param("ssssss", $search, $search, $search, $search, $search, $search);
    $stmt->execute();

    $result = $stmt->get_result();
    $staff_ids = [];

    while ($row = $result->fetch_assoc()) {
        $staff_id = (int) $row["user_id"];
        $staff_ids[] = $staff_id;

        $staff[$staff_id] = [
            "id" => $staff_id,
            "name" => trim($row["first_name"] . " " . $row["last_name"]),
            "code" => $row["login_identifier"] ?: "STAFF-" . $staff_id,
            "tags" => [$row["role"]],
            "positions" => [$row["role"]],
            "assignedJobsLabel" => "Punet e Caktuara",
            "jobs" => [],
            "jobsInProcess" => [
                "count" => 0,
                "label" => "Pune Ne Proces"
            ],
            "positionsLabel" => "Pozicionet e punes"
        ];
    }

    if (count($staff_ids) === 0) {
        return [];
    }

    $jobs_by_staff = getActiveJobsForStaff($conn, $staff_ids);

    foreach ($staff as $staff_id => $staff_member) {
        $jobs = $jobs_by_staff[$staff_id] ?? [];
        $staff[$staff_id]["jobs"] = $jobs;
        $staff[$staff_id]["jobsInProcess"]["count"] = count($jobs);
    }

    return array_values($staff);
}

function getActiveJobsForStaff($conn, $staff_ids) {
    $jobs_by_staff = [];
    $placeholders = implode(",", array_fill(0, count($staff_ids), "?"));
    $types = str_repeat("i", count($staff_ids));

    $sql = "
        SELECT
            j.job_id,
            j.staff_id,
            j.updated_at,
            v.plate_number,
            CONCAT(client_user.first_name, ' ', client_user.last_name) AS client_name
        FROM jobs j
        LEFT JOIN vehicles v ON v.vehicle_id = j.vehicle_id
        LEFT JOIN users client_user ON client_user.user_id = j.client_id
        WHERE j.status IN ('created', 'in_progress')
          AND j.staff_id IN ($placeholders)
        ORDER BY j.updated_at DESC
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        return $jobs_by_staff;
    }

    $stmt->bind_param($types, ...$staff_ids);
    $stmt->execute();

    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $staff_id = (int) $row["staff_id"];

        if (!isset($jobs_by_staff[$staff_id])) {
            $jobs_by_staff[$staff_id] = [];
        }

        $jobs_by_staff[$staff_id][] = [
            "id" => (int) $row["job_id"],
            "code" => $row["plate_number"],
            "client" => $row["client_name"],
            "date" => $row["updated_at"]
        ];
    }

    return $jobs_by_staff;
}

?>
