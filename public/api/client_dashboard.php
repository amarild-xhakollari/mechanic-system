<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../src/auth/session.php";
requireRoleJson("client");

$conn = require __DIR__ . "/../../src/config/db.php";
$client_id = (int) ($_SESSION["user_id"] ?? 0);

$user_sql = "
    SELECT user_id, first_name, last_name, email, phone_number
    FROM users
    WHERE user_id = ?
      AND role = 'client'
    LIMIT 1
";

$user_stmt = $conn->prepare($user_sql);

if (!$user_stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Client query failed."
    ]);
    exit;
}

$user_stmt->bind_param("i", $client_id);
$user_stmt->execute();
$user = $user_stmt->get_result()->fetch_assoc();

if (!$user) {
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
        cm.fuel_type,
        cm.engines
    FROM vehicles v
    LEFT JOIN carsmodels cm ON cm.id = v.car_model_id
    WHERE v.client_id = ?
    ORDER BY v.vehicle_id DESC
";

$vehicles_stmt = $conn->prepare($vehicles_sql);

if ($vehicles_stmt) {
    $vehicles_stmt->bind_param("i", $client_id);
    $vehicles_stmt->execute();
    $result = $vehicles_stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $vehicles[] = [
            "id" => (int) $row["vehicle_id"],
            "plate" => $row["plate_number"],
            "vin" => $row["vin"],
            "company" => $row["company_name"],
            "model" => $row["car_name"],
            "fuel" => $row["fuel_type"],
            "engine" => $row["engines"]
        ];
    }
}

$jobs = [];
$jobs_sql = "
    SELECT
        j.job_id,
        j.status,
        j.job_type,
        j.description,
        j.updated_at,
        v.plate_number,
        CONCAT(staff_user.first_name, ' ', staff_user.last_name) AS staff_name
    FROM jobs j
    LEFT JOIN vehicles v ON v.vehicle_id = j.vehicle_id
    LEFT JOIN users staff_user ON staff_user.user_id = j.staff_id
    WHERE j.client_id = ?
    ORDER BY
        CASE WHEN j.status IN ('created', 'in_progress') THEN 0 ELSE 1 END,
        j.updated_at DESC
";

$jobs_stmt = $conn->prepare($jobs_sql);

if ($jobs_stmt) {
    $jobs_stmt->bind_param("i", $client_id);
    $jobs_stmt->execute();
    $result = $jobs_stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $jobs[] = [
            "id" => (int) $row["job_id"],
            "plate" => $row["plate_number"],
            "staff" => trim($row["staff_name"] ?? ""),
            "status" => $row["status"],
            "type" => $row["job_type"],
            "description" => $row["description"],
            "updated_at" => $row["updated_at"]
        ];
    }
}

echo json_encode([
    "success" => true,
    "user" => [
        "id" => (int) $user["user_id"],
        "name" => trim(($user["first_name"] ?? "") . " " . ($user["last_name"] ?? "")),
        "email" => $user["email"],
        "phone" => $user["phone_number"]
    ],
    "vehicles" => $vehicles,
    "jobs" => $jobs
]);

?>
