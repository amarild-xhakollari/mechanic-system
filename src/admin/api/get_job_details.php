<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../auth/session.php";
requireAdminJson();

$conn = require __DIR__ . "/../../config/db.php";

$job_id = (int) ($_GET["job_id"] ?? 0);

if ($job_id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid job id."
    ]);
    exit;
}

$sql = "
    SELECT
        j.job_id,
        j.description,
        j.job_type,
        j.status,
        j.created_at,
        j.updated_at,
        client_user.first_name AS client_first_name,
        client_user.last_name AS client_last_name,
        client_user.email AS client_email,
        client_user.phone_number AS client_phone,
        staff_user.first_name AS staff_first_name,
        staff_user.last_name AS staff_last_name,
        staff_user.email AS staff_email,
        staff_user.phone_number AS staff_phone,
        creator_user.first_name AS creator_first_name,
        creator_user.last_name AS creator_last_name,
        v.vehicle_id,
        v.plate_number,
        v.vin,
        cm.company_name,
        cm.car_name,
        cm.engines,
        cm.capacity,
        cm.horsepower,
        cm.total_speed,
        cm.performance,
        cm.fuel_type,
        cm.seats,
        cm.torque
    FROM jobs j
    LEFT JOIN users client_user
        ON client_user.user_id = j.client_id
        AND client_user.role = 'client'
    LEFT JOIN users staff_user
        ON staff_user.user_id = j.staff_id
        AND staff_user.role IN ('staff', 'admin')
    LEFT JOIN users creator_user
        ON creator_user.user_id = j.created_by
    LEFT JOIN vehicles v ON v.vehicle_id = j.vehicle_id
    LEFT JOIN carsmodels cm ON cm.id = v.car_model_id
    WHERE j.job_id = ?
    LIMIT 1
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Job query failed."
    ]);
    exit;
}

$stmt->bind_param("i", $job_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if (!$row) {
    echo json_encode([
        "success" => false,
        "message" => "Job not found."
    ]);
    exit;
}

$updates = [];
$updates_sql = "
    SELECT
        ju.update_id,
        ju.old_status,
        ju.new_status,
        ju.note,
        ju.updated_at,
        CONCAT(updater.first_name, ' ', updater.last_name) AS updated_by_name
    FROM job_updates ju
    LEFT JOIN users updater ON updater.user_id = ju.updated_by
    WHERE ju.job_id = ?
    ORDER BY ju.updated_at DESC
";

$updates_stmt = $conn->prepare($updates_sql);

if ($updates_stmt) {
    $updates_stmt->bind_param("i", $job_id);
    $updates_stmt->execute();
    $updates_result = $updates_stmt->get_result();

    while ($update = $updates_result->fetch_assoc()) {
        $updates[] = [
            "id" => (int) $update["update_id"],
            "old_status" => $update["old_status"],
            "new_status" => $update["new_status"],
            "note" => $update["note"],
            "updated_at" => $update["updated_at"],
            "updated_by" => trim($update["updated_by_name"] ?? "")
        ];
    }
}

$client_name = trim(($row["client_first_name"] ?? "") . " " . ($row["client_last_name"] ?? ""));
$staff_name = trim(($row["staff_first_name"] ?? "") . " " . ($row["staff_last_name"] ?? ""));
$creator_name = trim(($row["creator_first_name"] ?? "") . " " . ($row["creator_last_name"] ?? ""));

echo json_encode([
    "success" => true,
    "job" => [
        "id" => (int) $row["job_id"],
        "description" => $row["description"],
        "job_type" => $row["job_type"],
        "status" => $row["status"],
        "created_at" => $row["created_at"],
        "updated_at" => $row["updated_at"],
        "created_by" => $creator_name,
        "client" => [
            "name" => $client_name,
            "email" => $row["client_email"],
            "phone" => $row["client_phone"]
        ],
        "staff" => [
            "name" => $staff_name,
            "email" => $row["staff_email"],
            "phone" => $row["staff_phone"]
        ],
        "vehicle" => [
            "id" => (int) ($row["vehicle_id"] ?? 0),
            "plate_number" => $row["plate_number"],
            "vin" => $row["vin"]
        ],
        "car_model" => [
            "company_name" => $row["company_name"],
            "car_name" => $row["car_name"],
            "engines" => $row["engines"],
            "capacity" => $row["capacity"],
            "horsepower" => $row["horsepower"],
            "total_speed" => $row["total_speed"],
            "performance" => $row["performance"],
            "fuel_type" => $row["fuel_type"],
            "seats" => $row["seats"],
            "torque" => $row["torque"]
        ],
        "updates" => $updates
    ]
]);

?>
