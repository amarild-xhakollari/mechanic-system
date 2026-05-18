<?php

require_once __DIR__ . "/../../auth/session.php";
requireAdminJson();

$mysqli = require __DIR__ . "/../../config/db.php";

header("Content-Type: application/json");

$q = trim($_GET["q"] ?? "");

if (strlen($q) < 2) {
    echo json_encode([]);
    exit;
}

$search = "%" . $q . "%";

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

$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    echo json_encode([]);
    exit;
}

$stmt->bind_param("sss", $search, $search, $search);
$stmt->execute();

$result = $stmt->get_result();

$cars = [];

while ($row = $result->fetch_assoc()) {
    $cars[] = $row;
}

echo json_encode($cars);
?>
