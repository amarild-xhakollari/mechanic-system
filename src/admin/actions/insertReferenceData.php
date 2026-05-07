<?php

require_once __DIR__ . "/../../auth/session.php";

$isCli = PHP_SAPI === "cli";

if (!$isCli) {
    requireAdminJson();
    header("Content-Type: application/json");
}

$conn = require __DIR__ . "/../../config/db.php";

function jsonResponse($payload) {
    echo json_encode($payload, JSON_PRETTY_PRINT);
    exit;
}

function firstCarModelId($conn) {
    $result = $conn->query("SELECT id FROM carsmodels ORDER BY id ASC LIMIT 1");
    $row = $result ? $result->fetch_assoc() : null;

    return $row ? (int) $row["id"] : 0;
}

function findUserByEmail($conn, $email) {
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ? LIMIT 1");

    if (!$stmt) {
        throw new RuntimeException("Could not prepare user lookup.");
    }

    $stmt->bind_param("s", $email);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    return $row ? (int) $row["user_id"] : 0;
}

function createReferenceUser($conn, $firstName, $lastName, $phone, $email, $loginIdentifier, $role, &$createdCount) {
    $existingId = findUserByEmail($conn, $email);

    if ($existingId > 0) {
        return $existingId;
    }

    $passwordHash = password_hash("password123", PASSWORD_DEFAULT);
    $stmt = $conn->prepare("
        INSERT INTO users
            (first_name, last_name, phone_number, email, login_identifier, role, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        throw new RuntimeException("Could not prepare user insert.");
    }

    $stmt->bind_param("sssssss", $firstName, $lastName, $phone, $email, $loginIdentifier, $role, $passwordHash);
    $stmt->execute();
    $createdCount++;

    return (int) $conn->insert_id;
}

function findVehicleByPlate($conn, $plateNumber) {
    $stmt = $conn->prepare("SELECT vehicle_id FROM vehicles WHERE plate_number = ? LIMIT 1");

    if (!$stmt) {
        throw new RuntimeException("Could not prepare vehicle lookup.");
    }

    $stmt->bind_param("s", $plateNumber);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    return $row ? (int) $row["vehicle_id"] : 0;
}

function createReferenceVehicle($conn, $clientId, $carModelId, $plateNumber, $vin, &$createdCount) {
    $existingId = findVehicleByPlate($conn, $plateNumber);

    if ($existingId > 0) {
        return $existingId;
    }

    $stmt = $conn->prepare("
        INSERT INTO vehicles (client_id, car_model_id, plate_number, vin)
        VALUES (?, ?, ?, ?)
    ");

    if (!$stmt) {
        throw new RuntimeException("Could not prepare vehicle insert.");
    }

    $stmt->bind_param("iiss", $clientId, $carModelId, $plateNumber, $vin);
    $stmt->execute();
    $createdCount++;

    return (int) $conn->insert_id;
}

function findJobByDescription($conn, $description) {
    $stmt = $conn->prepare("SELECT job_id FROM jobs WHERE description = ? LIMIT 1");

    if (!$stmt) {
        throw new RuntimeException("Could not prepare job lookup.");
    }

    $stmt->bind_param("s", $description);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    return $row ? (int) $row["job_id"] : 0;
}

function createReferenceJob($conn, $clientId, $vehicleId, $staffId, $createdBy, $description, $jobType, $status, &$createdCount) {
    $existingId = findJobByDescription($conn, $description);

    if ($existingId > 0) {
        return $existingId;
    }

    $stmt = $conn->prepare("
        INSERT INTO jobs
            (client_id, vehicle_id, staff_id, created_by, description, job_type, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        throw new RuntimeException("Could not prepare job insert.");
    }

    $stmt->bind_param("iiiisss", $clientId, $vehicleId, $staffId, $createdBy, $description, $jobType, $status);
    $stmt->execute();
    $createdCount++;

    return (int) $conn->insert_id;
}

function jobUpdateExists($conn, $jobId, $note) {
    $stmt = $conn->prepare("SELECT update_id FROM job_updates WHERE job_id = ? AND note = ? LIMIT 1");

    if (!$stmt) {
        throw new RuntimeException("Could not prepare job update lookup.");
    }

    $stmt->bind_param("is", $jobId, $note);
    $stmt->execute();

    return $stmt->get_result()->num_rows > 0;
}

function createReferenceJobUpdate($conn, $jobId, $updatedBy, $oldStatus, $newStatus, $note, &$createdCount) {
    if (jobUpdateExists($conn, $jobId, $note)) {
        return;
    }

    $stmt = $conn->prepare("
        INSERT INTO job_updates (job_id, updated_by, old_status, new_status, note)
        VALUES (?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        throw new RuntimeException("Could not prepare job update insert.");
    }

    $stmt->bind_param("iisss", $jobId, $updatedBy, $oldStatus, $newStatus, $note);
    $stmt->execute();
    $createdCount++;
}

function createAuditLog($conn, $entityName, $entityId, $action, $userId, $newData, &$createdCount) {
    $newJson = json_encode($newData);
    $stmt = $conn->prepare("
        INSERT INTO audit_log (entity_name, entity_id, action, user_id, old_data, new_data)
        VALUES (?, ?, ?, ?, NULL, ?)
    ");

    if (!$stmt) {
        throw new RuntimeException("Could not prepare audit log insert.");
    }

    $stmt->bind_param("sisis", $entityName, $entityId, $action, $userId, $newJson);
    $stmt->execute();
    $createdCount++;
}

$carModelId = firstCarModelId($conn);

if ($carModelId <= 0) {
    jsonResponse([
        "success" => false,
        "message" => "No car models were found. Import carsmodels data before running this reference insert."
    ]);
}

$created = [
    "users" => 0,
    "vehicles" => 0,
    "jobs" => 0,
    "job_updates" => 0,
    "audit_log" => 0
];

$conn->begin_transaction();

try {
    $adminId = createReferenceUser(
        $conn,
        "Reference",
        "Admin",
        "0670000001",
        "reference.admin@mechanic.test",
        "REFADMIN",
        "admin",
        $created["users"]
    );

    $staffId = createReferenceUser(
        $conn,
        "Reference",
        "Staff",
        "0670000002",
        "reference.staff@mechanic.test",
        "REFSTAFF",
        "staff",
        $created["users"]
    );

    $clientId = createReferenceUser(
        $conn,
        "Reference",
        "Client",
        "0670000003",
        "reference.client@mechanic.test",
        null,
        "client",
        $created["users"]
    );

    $vehicleId = createReferenceVehicle(
        $conn,
        $clientId,
        $carModelId,
        "REF 001 DB",
        "REFERENCE-VIN-00001",
        $created["vehicles"]
    );

    $jobId = createReferenceJob(
        $conn,
        $clientId,
        $vehicleId,
        $staffId,
        $adminId,
        "Reference maintenance job created from cars_db_reference.md.",
        "maintenance",
        "in_progress",
        $created["jobs"]
    );

    createReferenceJobUpdate(
        $conn,
        $jobId,
        $staffId,
        "created",
        "in_progress",
        "Reference job moved from created to in_progress.",
        $created["job_updates"]
    );

    createAuditLog($conn, "users", $clientId, "INSERT", $adminId, ["email" => "reference.client@mechanic.test"], $created["audit_log"]);
    createAuditLog($conn, "vehicles", $vehicleId, "INSERT", $adminId, ["plate_number" => "REF 001 DB"], $created["audit_log"]);
    createAuditLog($conn, "jobs", $jobId, "INSERT", $adminId, ["status" => "in_progress"], $created["audit_log"]);

    $conn->commit();

    jsonResponse([
        "success" => true,
        "message" => "Reference data inserted according to assets/docs/cars_db_reference.md.",
        "login" => [
            "admin_identifier" => "REFADMIN",
            "staff_identifier" => "REFSTAFF",
            "password" => "password123"
        ],
        "ids" => [
            "admin_id" => $adminId,
            "staff_id" => $staffId,
            "client_id" => $clientId,
            "vehicle_id" => $vehicleId,
            "job_id" => $jobId,
            "car_model_id" => $carModelId
        ],
        "created" => $created
    ]);
} catch (Throwable $error) {
    $conn->rollback();

    jsonResponse([
        "success" => false,
        "message" => "Reference data insert failed.",
        "error" => $error->getMessage()
    ]);
}

?>
