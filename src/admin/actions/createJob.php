<?php

require_once __DIR__ . "/../../auth/session.php";
requireAdminJson();

$conn = require __DIR__ . "/../../config/db.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request."
    ]);
    exit;
}

function fail($message) {
    echo json_encode([
        "success" => false,
        "message" => $message
    ]);
    exit;
}

function getClientById($conn, $clientId) {
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE user_id = ? AND role = 'client' LIMIT 1");
    if (!$stmt) return null;
    $stmt->bind_param("i", $clientId);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

function valueExists($conn, $table, $column, $value) {
    $allowed = [
        "users.phone_number",
        "users.email",
        "vehicles.plate_number",
        "vehicles.vin"
    ];

    if (!in_array($table . "." . $column, $allowed, true)) {
        return true;
    }

    $stmt = $conn->prepare("SELECT 1 FROM $table WHERE $column = ? LIMIT 1");
    if (!$stmt) return true;
    $stmt->bind_param("s", $value);
    $stmt->execute();
    return $stmt->get_result()->num_rows > 0;
}

$jobType = $data["job_type"] ?? "";
$description = trim($data["description"] ?? "");
$status = $data["status"] ?? "created";
$staffId = (int) ($data["staff_id"] ?? 0);
$vehicleMode = $data["vehicle_mode"] ?? "existing";
$clientMode = $data["client_mode"] ?? "existing";
$createdBy = (int) ($_SESSION["user_id"] ?? 0);

if (!in_array($jobType, ["maintenance", "damage_repair"], true)) {
    fail("Zgjidhni llojin e punes.");
}

if ($description === "") {
    fail("Pershkrimi i punes eshte i detyrueshem.");
}

if (!in_array($status, ["created", "in_progress", "completed", "cancelled"], true)) {
    fail("Statusi nuk eshte i vlefshem.");
}

if ($staffId <= 0) {
    fail("Zgjidhni stafin.");
}

$staffStmt = $conn->prepare("SELECT user_id FROM users WHERE user_id = ? AND role = 'staff' LIMIT 1");
if (!$staffStmt) fail("Staff query failed.");
$staffStmt->bind_param("i", $staffId);
$staffStmt->execute();
if ($staffStmt->get_result()->num_rows === 0) {
    fail("Stafi nuk ekziston.");
}

$conn->begin_transaction();

try {
    $clientId = 0;
    $vehicleId = 0;
    $generatedClientCode = null;

    if ($vehicleMode === "existing") {
        $vehicleId = (int) ($data["vehicle_id"] ?? 0);

        if ($vehicleId <= 0) {
            throw new RuntimeException("Zgjidhni automjetin ekzistues.");
        }

        $vehicleStmt = $conn->prepare("
            SELECT vehicle_id, client_id
            FROM vehicles
            WHERE vehicle_id = ?
            LIMIT 1
        ");

        if (!$vehicleStmt) {
            throw new RuntimeException("Vehicle query failed.");
        }

        $vehicleStmt->bind_param("i", $vehicleId);
        $vehicleStmt->execute();
        $vehicle = $vehicleStmt->get_result()->fetch_assoc();

        if (!$vehicle) {
            throw new RuntimeException("Automjeti nuk ekziston.");
        }

        $clientId = (int) $vehicle["client_id"];
    } else {
        if ($clientMode === "existing") {
            $clientId = (int) ($data["client_id"] ?? 0);

            if ($clientId <= 0 || !getClientById($conn, $clientId)) {
                throw new RuntimeException("Zgjidhni klientin ekzistues.");
            }
        } else {
            $firstName = trim($data["client"]["first_name"] ?? "");
            $lastName = trim($data["client"]["last_name"] ?? "");
            $phone = trim($data["client"]["phone"] ?? "");
            $email = trim($data["client"]["email"] ?? "");

            if ($firstName === "" || $lastName === "" || $phone === "" || $email === "") {
                throw new RuntimeException("Plotesoni te dhenat e klientit.");
            }

            if (valueExists($conn, "users", "phone_number", $phone)) {
                throw new RuntimeException("Ky numer telefoni ekziston.");
            }

            if (valueExists($conn, "users", "email", $email)) {
                throw new RuntimeException("Ky email ekziston.");
            }

            $generatedClientCode = trim($data["client"]["generated_code"] ?? "");

            if ($generatedClientCode === "") {
                throw new RuntimeException("Gjeneroni kodin e klientit.");
            }

            $passwordHash = password_hash($generatedClientCode, PASSWORD_DEFAULT);
            $role = "client";
            $loginIdentifier = null;

            $clientStmt = $conn->prepare("
                INSERT INTO users
                    (first_name, last_name, phone_number, email, login_identifier, role, password_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            if (!$clientStmt) {
                throw new RuntimeException("Client insert failed.");
            }

            $clientStmt->bind_param("sssssss", $firstName, $lastName, $phone, $email, $loginIdentifier, $role, $passwordHash);
            $clientStmt->execute();
            $clientId = (int) $conn->insert_id;
        }

        $carModelId = (int) ($data["vehicle"]["car_model_id"] ?? 0);
        $plateNumber = trim($data["vehicle"]["plate_number"] ?? "");
        $vin = trim($data["vehicle"]["vin"] ?? "");

        if ($carModelId <= 0 || $plateNumber === "" || $vin === "") {
            throw new RuntimeException("Plotesoni te dhenat e automjetit.");
        }

        if (valueExists($conn, "vehicles", "plate_number", $plateNumber)) {
            throw new RuntimeException("Kjo targe ekziston.");
        }

        if (valueExists($conn, "vehicles", "vin", $vin)) {
            throw new RuntimeException("Ky VIN ekziston.");
        }

        $modelStmt = $conn->prepare("SELECT id FROM carsmodels WHERE id = ? LIMIT 1");
        if (!$modelStmt) {
            throw new RuntimeException("Car model query failed.");
        }
        $modelStmt->bind_param("i", $carModelId);
        $modelStmt->execute();
        if ($modelStmt->get_result()->num_rows === 0) {
            throw new RuntimeException("Modeli i automjetit nuk ekziston.");
        }

        $vehicleStmt = $conn->prepare("
            INSERT INTO vehicles (client_id, car_model_id, plate_number, vin)
            VALUES (?, ?, ?, ?)
        ");

        if (!$vehicleStmt) {
            throw new RuntimeException("Vehicle insert failed.");
        }

        $vehicleStmt->bind_param("iiss", $clientId, $carModelId, $plateNumber, $vin);
        $vehicleStmt->execute();
        $vehicleId = (int) $conn->insert_id;
    }

    if ($clientId <= 0 || $vehicleId <= 0) {
        throw new RuntimeException("Klienti ose automjeti mungon.");
    }

    $jobStmt = $conn->prepare("
        INSERT INTO jobs
            (client_id, vehicle_id, staff_id, created_by, description, job_type, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$jobStmt) {
        throw new RuntimeException("Job insert failed.");
    }

    $jobStmt->bind_param("iiiisss", $clientId, $vehicleId, $staffId, $createdBy, $description, $jobType, $status);
    $jobStmt->execute();
    $jobId = (int) $conn->insert_id;

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Puna u regjistrua me sukses.",
        "job_id" => $jobId,
        "generated_client_code" => $generatedClientCode
    ]);
} catch (Throwable $error) {
    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => $error->getMessage()
    ]);
}

?>
