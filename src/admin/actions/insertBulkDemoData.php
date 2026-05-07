<?php

require_once __DIR__ . "/../../auth/session.php";

$isCli = PHP_SAPI === "cli";

if (!$isCli) {
    requireAdminJson();
    header("Content-Type: application/json");
}

$conn = require __DIR__ . "/../../config/db.php";

function respond($payload) {
    echo json_encode($payload, JSON_PRETTY_PRINT);
    exit;
}

function getCarModelIds($conn, $limit) {
    $ids = [];
    $result = $conn->query("SELECT id FROM carsmodels ORDER BY id ASC LIMIT " . (int) $limit);

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $ids[] = (int) $row["id"];
        }
    }

    return $ids;
}

function findUserByEmail($conn, $email) {
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ? LIMIT 1");
    if (!$stmt) throw new RuntimeException("Could not prepare user lookup.");

    $stmt->bind_param("s", $email);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    return $row ? (int) $row["user_id"] : 0;
}

function createUserIfMissing($conn, $firstName, $lastName, $phone, $email, $loginIdentifier, $role, &$createdCount) {
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

    if (!$stmt) throw new RuntimeException("Could not prepare user insert.");

    $stmt->bind_param("sssssss", $firstName, $lastName, $phone, $email, $loginIdentifier, $role, $passwordHash);
    $stmt->execute();
    $createdCount++;

    return (int) $conn->insert_id;
}

function getAdminId($conn, &$createdUsers) {
    $result = $conn->query("SELECT user_id FROM users WHERE role = 'admin' ORDER BY user_id ASC LIMIT 1");
    $row = $result ? $result->fetch_assoc() : null;

    if ($row) {
        return (int) $row["user_id"];
    }

    return createUserIfMissing(
        $conn,
        "Bulk",
        "Admin",
        "0675000000",
        "bulk.admin@mechanic.test",
        "BULKADMIN",
        "admin",
        $createdUsers
    );
}

function findVehicleByPlate($conn, $plateNumber) {
    $stmt = $conn->prepare("SELECT vehicle_id FROM vehicles WHERE plate_number = ? LIMIT 1");
    if (!$stmt) throw new RuntimeException("Could not prepare vehicle lookup.");

    $stmt->bind_param("s", $plateNumber);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    return $row ? (int) $row["vehicle_id"] : 0;
}

function createVehicleIfMissing($conn, $clientId, $carModelId, $plateNumber, $vin, &$createdCount) {
    $existingId = findVehicleByPlate($conn, $plateNumber);

    if ($existingId > 0) {
        return $existingId;
    }

    $stmt = $conn->prepare("
        INSERT INTO vehicles (client_id, car_model_id, plate_number, vin)
        VALUES (?, ?, ?, ?)
    ");

    if (!$stmt) throw new RuntimeException("Could not prepare vehicle insert.");

    $stmt->bind_param("iiss", $clientId, $carModelId, $plateNumber, $vin);
    $stmt->execute();
    $createdCount++;

    return (int) $conn->insert_id;
}

function findJobByDescription($conn, $description) {
    $stmt = $conn->prepare("SELECT job_id FROM jobs WHERE description = ? LIMIT 1");
    if (!$stmt) throw new RuntimeException("Could not prepare job lookup.");

    $stmt->bind_param("s", $description);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    return $row ? (int) $row["job_id"] : 0;
}

function createJobIfMissing($conn, $clientId, $vehicleId, $staffId, $createdBy, $description, $jobType, $status, &$createdCount) {
    $existingId = findJobByDescription($conn, $description);

    if ($existingId > 0) {
        return $existingId;
    }

    $stmt = $conn->prepare("
        INSERT INTO jobs
            (client_id, vehicle_id, staff_id, created_by, description, job_type, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$stmt) throw new RuntimeException("Could not prepare job insert.");

    $stmt->bind_param("iiiisss", $clientId, $vehicleId, $staffId, $createdBy, $description, $jobType, $status);
    $stmt->execute();
    $createdCount++;

    return (int) $conn->insert_id;
}

function makePlate($index) {
    $left = ["AA", "BB", "CC", "DD", "EE", "FF", "GG", "HH", "II", "JJ"];
    $right = ["KL", "MN", "OP", "QR", "ST", "UV", "WX", "YZ", "AB", "CD"];
    $number = str_pad((string) (500 + $index), 3, "0", STR_PAD_LEFT);

    return "BULK " . $left[$index % count($left)] . $number . $right[$index % count($right)];
}

$carModelIds = getCarModelIds($conn, 50);

if (count($carModelIds) === 0) {
    respond([
        "success" => false,
        "message" => "No car models found. Import carsmodels before inserting demo data."
    ]);
}

$created = [
    "staff" => 0,
    "clients" => 0,
    "vehicles" => 0,
    "jobs" => 0,
    "admin" => 0
];

$staffFirstNames = ["Arben", "Leonid", "Medin", "Kushtrim", "Elton", "Besart", "Ilir", "Gent"];
$staffLastNames = ["Hoxha", "Liman", "Muriqi", "Krasniqi", "Deda", "Lika", "Meta", "Prenga"];
$clientFirstNames = [
    "Fatmir", "Bujar", "Doruntina", "Artan", "Besim", "Elira", "Ardit", "Nora", "Florian", "Sara",
    "Dritan", "Alba", "Kledi", "Mira", "Luan", "Erisa", "Valon", "Ariana", "Toni", "Ina",
    "Genti", "Rina", "Edi", "Lori", "Altin", "Sindi", "Andi", "Klea", "Ilir", "Era",
    "Denis", "Anisa", "Ronaldo", "Tea", "Marsel", "Jona", "Ermal", "Neda", "Arian", "Dafina"
];
$clientLastNames = [
    "Feta", "Dema", "Dilo", "Berberi", "Demolli", "Kola", "Koci", "Lika", "Meta", "Basha",
    "Mema", "Prenga", "Cela", "Hasa", "Pasha", "Kodra", "Gashi", "Bardhi", "Duka", "Molla",
    "Rama", "Hoxha", "Zefi", "Leka", "Shala", "Kasa", "Vata", "Bega", "Tafa", "Nika",
    "Hila", "Kume", "Balla", "Gjoni", "Muca", "Daci", "Shehu", "Koci", "Biba", "Lala"
];
$statuses = ["created", "in_progress", "completed", "cancelled", "in_progress"];
$jobTypes = ["maintenance", "damage_repair"];

$conn->begin_transaction();

try {
    $adminId = getAdminId($conn, $created["admin"]);
    $staffIds = [];
    $clientIds = [];
    $vehicleIds = [];

    for ($i = 0; $i < 8; $i++) {
        $staffIds[] = createUserIfMissing(
            $conn,
            $staffFirstNames[$i],
            $staffLastNames[$i],
            "067510" . str_pad((string) ($i + 1), 4, "0", STR_PAD_LEFT),
            "bulk.staff" . ($i + 1) . "@mechanic.test",
            "BULK-STF-" . str_pad((string) ($i + 1), 3, "0", STR_PAD_LEFT),
            "staff",
            $created["staff"]
        );
    }

    for ($i = 0; $i < 40; $i++) {
        $clientIds[] = createUserIfMissing(
            $conn,
            $clientFirstNames[$i],
            $clientLastNames[$i],
            "069510" . str_pad((string) ($i + 1), 4, "0", STR_PAD_LEFT),
            "bulk.client" . ($i + 1) . "@mechanic.test",
            null,
            "client",
            $created["clients"]
        );
    }

    for ($i = 0; $i < 50; $i++) {
        $clientId = $clientIds[$i % count($clientIds)];
        $vehicleIds[] = createVehicleIfMissing(
            $conn,
            $clientId,
            $carModelIds[$i % count($carModelIds)],
            makePlate($i + 1),
            "BULK-VIN-" . str_pad((string) ($i + 1), 8, "0", STR_PAD_LEFT),
            $created["vehicles"]
        );
    }

    for ($i = 0; $i < 50; $i++) {
        $clientId = $clientIds[$i % count($clientIds)];
        $vehicleId = $vehicleIds[$i];
        $staffId = $staffIds[$i % count($staffIds)];
        $description = "Bulk demo job #" . str_pad((string) ($i + 1), 3, "0", STR_PAD_LEFT);

        createJobIfMissing(
            $conn,
            $clientId,
            $vehicleId,
            $staffId,
            $adminId,
            $description,
            $jobTypes[$i % count($jobTypes)],
            $statuses[$i % count($statuses)],
            $created["jobs"]
        );
    }

    $conn->commit();

    respond([
        "success" => true,
        "message" => "Bulk demo data inserted.",
        "created" => $created,
        "requested" => [
            "staff" => 8,
            "clients" => 40,
            "jobs" => 50
        ],
        "login" => [
            "staff_identifier_example" => "BULK-STF-001",
            "password" => "password123"
        ]
    ]);
} catch (Throwable $error) {
    $conn->rollback();

    respond([
        "success" => false,
        "message" => "Bulk demo insert failed.",
        "error" => $error->getMessage()
    ]);
}

?>
