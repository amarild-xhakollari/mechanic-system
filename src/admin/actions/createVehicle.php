<?php

$mysqli = require __DIR__ . "/../../config/db.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request."
    ]);
    exit;
}

$client_id = $data["client_id"] ?? null;
$car_model_id = $data["car_model_id"] ?? null;
$plate_number = trim($data["plate_number"] ?? "");
$vin = trim($data["vin"] ?? "");

if (!$client_id || !$car_model_id || empty($plate_number) || empty($vin)) {
    echo json_encode([
        "success" => false,
        "message" => "All fields are required."
    ]);
    exit;
}

// kontrollo nëse client ekziston
$sqlClient = "SELECT user_id FROM users WHERE user_id = ? AND role = 'client'";
$stmtClient = $mysqli->prepare($sqlClient);
$stmtClient->bind_param("i", $client_id);
$stmtClient->execute();
$resultClient = $stmtClient->get_result();

if ($resultClient->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Client does not exist."
    ]);
    exit;
}

// kontrollo nëse car model ekziston
$sqlCar = "SELECT id FROM carsmodels WHERE id = ?";
$stmtCar = $mysqli->prepare($sqlCar);
$stmtCar->bind_param("i", $car_model_id);
$stmtCar->execute();
$resultCar = $stmtCar->get_result();

if ($resultCar->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Car model does not exist."
    ]);
    exit;
}

// kontrollo plate duplicate
$sqlPlate = "SELECT vehicle_id FROM vehicles WHERE plate_number = ?";
$stmtPlate = $mysqli->prepare($sqlPlate);
$stmtPlate->bind_param("s", $plate_number);
$stmtPlate->execute();
$resultPlate = $stmtPlate->get_result();

if ($resultPlate->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "Plate number already exists."
    ]);
    exit;
}

// kontrollo VIN duplicate
$sqlVin = "SELECT vehicle_id FROM vehicles WHERE vin = ?";
$stmtVin = $mysqli->prepare($sqlVin);
$stmtVin->bind_param("s", $vin);
$stmtVin->execute();
$resultVin = $stmtVin->get_result();

if ($resultVin->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "VIN already exists."
    ]);
    exit;
}

// insert vehicle
$sqlInsert = "
    INSERT INTO vehicles 
    (client_id, car_model_id, plate_number, vin)
    VALUES (?, ?, ?, ?)
";

$stmtInsert = $mysqli->prepare($sqlInsert);

if (!$stmtInsert) {
    echo json_encode([
        "success" => false,
        "message" => "Insert prepare failed."
    ]);
    exit;
}

$stmtInsert->bind_param(
    "iiss",
    $client_id,
    $car_model_id,
    $plate_number,
    $vin
);

if ($stmtInsert->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Vehicle created successfully."
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Vehicle could not be created."
    ]);
}
?>
