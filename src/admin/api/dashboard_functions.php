<?php

function connect_to_database() {
    return require __DIR__ . "/../../config/db.php";
}

function get_number($conn, $sql) {
    $result = mysqli_query($conn, $sql);

    if (!$result) {
        return 0;
    }

    $row = mysqli_fetch_assoc($result);
    return (int) $row["total"];
}

function get_logged_user($conn) {
    if (!isset($_SESSION["user_id"])) {
        return [
            "name" => "",
            "role" => "",
            "logoutText" => "Dil nga llogaria"
        ];
    }

    $user_id = (int) $_SESSION["user_id"];

    $sql = "
        SELECT first_name, last_name, role
        FROM users
        WHERE user_id = $user_id
        LIMIT 1
    ";

    $result = mysqli_query($conn, $sql);

    if (!$result || mysqli_num_rows($result) === 0) {
        return [
            "name" => "",
            "role" => "",
            "logoutText" => "Dil nga llogaria"
        ];
    }

    $row = mysqli_fetch_assoc($result);

    return [
        "name" => trim($row["first_name"] . " " . $row["last_name"]),
        "role" => $row["role"],
        "logoutText" => "Dil nga llogaria"
    ];
}

function get_dashboard_stats($conn) {
    return [
        "activeJobs" => get_number($conn, "SELECT COUNT(*) AS total FROM jobs WHERE status IN ('created', 'in_progress')"),
        "staff" => get_number($conn, "SELECT COUNT(*) AS total FROM users WHERE role = 'staff'"),
        "clients" => get_number($conn, "SELECT COUNT(*) AS total FROM users WHERE role = 'client'")
    ];
}

function get_active_jobs($conn) {
    $jobs = [];

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
        WHERE j.status IN ('created', 'in_progress')
        ORDER BY j.updated_at DESC
    ";

    $result = mysqli_query($conn, $sql);

    if (!$result) {
        return $jobs;
    }

    while ($row = mysqli_fetch_assoc($result)) {
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

function get_all_jobs($conn) {
    $jobs = [];

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
        ORDER BY j.updated_at DESC
    ";

    $result = mysqli_query($conn, $sql);

    if (!$result) {
        return $jobs;
    }

    while ($row = mysqli_fetch_assoc($result)) {
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

function get_staff($conn) {
    $staff = [];
    $jobs_by_staff = get_staff_active_jobs($conn);

    $sql = "
        SELECT user_id, first_name, last_name, role, login_identifier
        FROM users
        WHERE role = 'staff'
        ORDER BY first_name, last_name
    ";

    $result = mysqli_query($conn, $sql);

    if (!$result) {
        return $staff;
    }

    while ($row = mysqli_fetch_assoc($result)) {
        $staff_id = (int) $row["user_id"];
        $jobs = $jobs_by_staff[$staff_id] ?? [];

        $staff[] = [
            "id" => $staff_id,
            "name" => trim($row["first_name"] . " " . $row["last_name"]),
            "code" => $row["login_identifier"] ?: "STAFF-" . $staff_id,
            "tags" => [$row["role"]],
            "positions" => [$row["role"]],
            "assignedJobsLabel" => "Punet e Caktuara",
            "jobs" => $jobs,
            "jobsInProcess" => [
                "count" => count($jobs),
                "label" => "Pune Ne Proces"
            ],
            "positionsLabel" => "Pozicionet e punes"
        ];
    }

    return $staff;
}

function get_staff_active_jobs($conn) {
    $jobs_by_staff = [];

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
          AND j.staff_id IS NOT NULL
        ORDER BY j.updated_at DESC
    ";

    $result = mysqli_query($conn, $sql);

    if (!$result) {
        return $jobs_by_staff;
    }

    while ($row = mysqli_fetch_assoc($result)) {
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

function get_clients($conn) {
    $clients = [];

    $sql = "
        SELECT
            u.user_id,
            u.first_name,
            u.last_name,
            u.phone_number,
            u.email,
            COUNT(j.job_id) AS active_jobs
        FROM users u
        LEFT JOIN jobs j
            ON j.client_id = u.user_id
            AND j.status IN ('created', 'in_progress')
        WHERE u.role = 'client'
        GROUP BY u.user_id, u.first_name, u.last_name, u.phone_number, u.email
        ORDER BY u.first_name, u.last_name
    ";

    $result = mysqli_query($conn, $sql);

    if (!$result) {
        return $clients;
    }

    while ($row = mysqli_fetch_assoc($result)) {
        $clients[] = [
            "id" => (int) $row["user_id"],
            "name" => trim($row["first_name"] . " " . $row["last_name"]),
            "phone" => $row["phone_number"],
            "email" => $row["email"],
            "detail" => $row["active_jobs"] . " pune aktive"
        ];
    }

    return $clients;
}

function get_dashboard_data($conn) {
    return [
        "user" => get_logged_user($conn),
        "notificationCount" => 0,
        "stats" => get_dashboard_stats($conn),
        "activeJobs" => get_active_jobs($conn),
        "jobs" => get_all_jobs($conn),
        "staff" => get_staff($conn),
        "clients" => get_clients($conn)
    ];
}

?>
