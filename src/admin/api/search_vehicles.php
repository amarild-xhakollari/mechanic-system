<?php

require_once __DIR__ . "/../../auth/session.php";
requireAdminJson();

$conn = require __DIR__ . "/../../config/db.php";

header("Content-Type: application/json");

$q = trim($_GET["q"] ?? "");

if (strlen($q) < 2) {
    echo json_encode([]);
    exit;
}

$search = "%" . $q . "%";

$sql = "
    SELECT
        v.vehicle_id,
        v.client_id,
        v.car_model_id,
        v.plate_number,
        v.vin,
        client_user.first_name AS client_first_name,
        client_user.last_name AS client_last_name,
        client_user.phone_number AS client_phone,
        client_user.email AS client_email,
        cm.company_name,
        cm.car_name,
        cm.engines,
        cm.fuel_type
    FROM vehicles v
    LEFT JOIN users client_user ON client_user.user_id = v.client_id
    LEFT JOIN carsmodels cm ON cm.id = v.car_model_id
    WHERE v.plate_number LIKE ?
       OR v.vin LIKE ?
       OR CONCAT(client_user.first_name, ' ', client_user.last_name) LIKE ?
       OR client_user.phone_number LIKE ?
       OR CONCAT(cm.company_name, ' ', cm.car_name) LIKE ?
    ORDER BY v.vehicle_id DESC
    LIMIT 12
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([]);
    exit;
}

$stmt->bind_param("sssss", $search, $search, $search, $search, $search);
$stmt->execute();
$result = $stmt->get_result();

$vehicles = [];

while ($row = $result->fetch_assoc()) {
    $vehicles[] = [
        "id" => (int) $row["vehicle_id"],
        "client_id" => (int) $row["client_id"],
        "car_model_id" => (int) $row["car_model_id"],
        "plate_number" => $row["plate_number"],
        "vin" => $row["vin"],
        "client" => [
            "id" => (int) $row["client_id"],
            "first_name" => $row["client_first_name"],
            "last_name" => $row["client_last_name"],
            "name" => trim(($row["client_first_name"] ?? "") . " " . ($row["client_last_name"] ?? "")),
            "phone" => $row["client_phone"],
            "email" => $row["client_email"]
        ],
        "model" => [
            "id" => (int) $row["car_model_id"],
            "company_name" => $row["company_name"],
            "car_name" => $row["car_name"],
            "engines" => $row["engines"],
            "fuel_type" => $row["fuel_type"]
        ]
    ];
}

echo json_encode($vehicles);

?>
