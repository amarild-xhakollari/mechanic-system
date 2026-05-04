<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../auth/session.php";
requireAdminJson();

$conn = require __DIR__ . "/../../config/db.php";

$client_id = (int) ($_GET["client_id"] ?? 0);

if ($client_id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid client id."
    ]);
    exit;
}

$sql = "
    SELECT
        u.user_id,
        u.first_name,
        u.last_name,
        u.phone_number,
        u.email,
        u.login_identifier,
        COUNT(DISTINCT v.vehicle_id) AS vehicle_count,
        COUNT(DISTINCT j.job_id) AS total_jobs
    FROM users u
    LEFT JOIN vehicles v ON v.client_id = u.user_id
    LEFT JOIN jobs j ON j.client_id = u.user_id
    WHERE u.user_id = ?
      AND u.role = 'client'
    GROUP BY
        u.user_id,
        u.first_name,
        u.last_name,
        u.phone_number,
        u.email,
        u.login_identifier
    LIMIT 1
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Client query failed."
    ]);
    exit;
}

$stmt->bind_param("i", $client_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if (!$row) {
    echo json_encode([
        "success" => false,
        "message" => "Client not found."
    ]);
    exit;
}

$vehicles = [];
$vehicles_sql = "
    SELECT
        v.vehicle_id,
        v.plate_number,
        v.vin,
        cm.company_name,
        cm.car_name,
        cm.fuel_type
    FROM vehicles v
    LEFT JOIN carsmodels cm ON cm.id = v.car_model_id
    WHERE v.client_id = ?
    ORDER BY v.vehicle_id DESC
";

$vehicles_stmt = $conn->prepare($vehicles_sql);

if ($vehicles_stmt) {
    $vehicles_stmt->bind_param("i", $client_id);
    $vehicles_stmt->execute();
    $vehicles_result = $vehicles_stmt->get_result();

    while ($vehicle = $vehicles_result->fetch_assoc()) {
        $vehicles[] = [
            "id" => (int) $vehicle["vehicle_id"],
            "plate_number" => $vehicle["plate_number"],
            "vin" => $vehicle["vin"],
            "company_name" => $vehicle["company_name"],
            "car_name" => $vehicle["car_name"],
            "fuel_type" => $vehicle["fuel_type"]
        ];
    }
}

$active_jobs = [];
$jobs_sql = "
    SELECT
        j.job_id,
        j.status,
        j.updated_at,
        v.plate_number,
        CONCAT(staff_user.first_name, ' ', staff_user.last_name) AS staff_name
    FROM jobs j
    LEFT JOIN vehicles v ON v.vehicle_id = j.vehicle_id
    LEFT JOIN users staff_user ON staff_user.user_id = j.staff_id
    WHERE j.client_id = ?
      AND j.status IN ('created', 'in_progress')
    ORDER BY j.updated_at DESC
";

$jobs_stmt = $conn->prepare($jobs_sql);

if ($jobs_stmt) {
    $jobs_stmt->bind_param("i", $client_id);
    $jobs_stmt->execute();
    $jobs_result = $jobs_stmt->get_result();

    while ($job = $jobs_result->fetch_assoc()) {
        $active_jobs[] = [
            "id" => (int) $job["job_id"],
            "code" => $job["plate_number"],
            "staff" => trim($job["staff_name"] ?? ""),
            "date" => $job["updated_at"],
            "status" => $job["status"]
        ];
    }
}

$name = trim(($row["first_name"] ?? "") . " " . ($row["last_name"] ?? ""));
$code = $row["login_identifier"] ?: "KL-" . $row["user_id"];

echo json_encode([
    "success" => true,
    "client" => [
        "id" => (int) $row["user_id"],
        "name" => $name,
        "code" => $code,
        "email" => $row["email"],
        "phone" => $row["phone_number"],
        "vehicle_count" => (int) $row["vehicle_count"],
        "total_jobs" => (int) $row["total_jobs"],
        "vehicles" => $vehicles,
        "active_jobs" => $active_jobs
    ]
]);

?>
