<?php

function getVehicleCreatePayload() {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!is_array($data)) {
        return null;
    }

    return [
        'client_id' => $data['client_id'] ?? null,
        'car_model_id' => $data['car_model_id'] ?? null,
        'plate_number' => trim($data['plate_number'] ?? ''),
        'vin' => trim($data['vin'] ?? ''),
    ];
}

function validateVehicleCreatePayload($vehicleData) {
    if (!$vehicleData) {
        return "Invalid request.";
    }

    if (
        empty($vehicleData['client_id']) ||
        empty($vehicleData['car_model_id']) ||
        $vehicleData['plate_number'] === '' ||
        $vehicleData['vin'] === ''
    ) {
        return "All fields are required.";
    }

    return null;
}

function clientExists($conn, $clientId) {
    $sql = "SELECT user_id FROM users WHERE user_id = ? AND role = 'client'";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $clientId);
    $stmt->execute();

    return $stmt->get_result()->num_rows > 0;
}

function carModelExists($conn, $carModelId) {
    $sql = "SELECT id FROM carsmodels WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $carModelId);
    $stmt->execute();

    return $stmt->get_result()->num_rows > 0;
}

function vehiclePlateExists($conn, $plateNumber) {
    $sql = "SELECT vehicle_id FROM vehicles WHERE plate_number = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $plateNumber);
    $stmt->execute();

    return $stmt->get_result()->num_rows > 0;
}

function vehicleVinExists($conn, $vin) {
    $sql = "SELECT vehicle_id FROM vehicles WHERE vin = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $vin);
    $stmt->execute();

    return $stmt->get_result()->num_rows > 0;
}

function createVehicle($conn, $vehicleData) {
    $sql = "
        INSERT INTO vehicles (client_id, car_model_id, plate_number, vin)
        VALUES (?, ?, ?, ?)
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        return false;
    }

    $stmt->bind_param(
        "iiss",
        $vehicleData['client_id'],
        $vehicleData['car_model_id'],
        $vehicleData['plate_number'],
        $vehicleData['vin']
    );

    return $stmt->execute();
}

?>
