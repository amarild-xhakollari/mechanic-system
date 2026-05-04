<?php

require_once __DIR__ . "/../../auth/session.php";

$isCli = PHP_SAPI === "cli";

if (!$isCli) {
    requireAdminJson();
    header("Content-Type: application/json");
}

$conn = require __DIR__ . "/../../config/db.php";

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

function getAdminId($conn) {
    $sessionAdminId = (int) ($_SESSION["user_id"] ?? 0);

    if ($sessionAdminId > 0) {
        return $sessionAdminId;
    }

    $result = $conn->query("SELECT user_id FROM users WHERE role = 'admin' ORDER BY user_id ASC LIMIT 1");
    $row = $result ? $result->fetch_assoc() : null;

    return $row ? (int) $row["user_id"] : 0;
}

function createUser($conn, $firstName, $lastName, $phone, $email, $loginIdentifier, $role) {
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

    return (int) $conn->insert_id;
}

function createVehicle($conn, $clientId, $carModelId, $plateNumber, $vin) {
    $stmt = $conn->prepare("
        INSERT INTO vehicles
            (client_id, car_model_id, plate_number, vin)
        VALUES (?, ?, ?, ?)
    ");

    if (!$stmt) {
        throw new RuntimeException("Could not prepare vehicle insert.");
    }

    $stmt->bind_param("iiss", $clientId, $carModelId, $plateNumber, $vin);
    $stmt->execute();

    return (int) $conn->insert_id;
}

function createJob($conn, $clientId, $vehicleId, $staffId, $createdBy, $description, $jobType, $status) {
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

    return (int) $conn->insert_id;
}

function makePlate($index) {
    $letters = ["AB", "CD", "EF", "GH", "KL", "MN", "OP", "QR", "ST", "UV", "WX", "YZ"];
    $left = $letters[$index % count($letters)];
    $right = $letters[($index + 5) % count($letters)];
    $number = str_pad((string) (($index * 37 + 123) % 900 + 100), 3, "0", STR_PAD_LEFT);

    return $left . " " . $number . " " . $right;
}

$adminId = getAdminId($conn);
$carModelIds = getCarModelIds($conn, 60);

if ($adminId <= 0 || count($carModelIds) === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Admin user or car model data is missing."
    ], JSON_PRETTY_PRINT);
    exit;
}

$staffFirstNames = ["Arben", "Leonid", "Medin", "Kushtrim", "Elton", "Besart", "Ilir", "Gent", "Dorian", "Sokol"];
$staffLastNames = ["Hoxha", "Liman", "Muriqi", "Krasniqi", "Deda", "Lika", "Meta", "Prenga", "Dervishi", "Basha"];
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

$jobTypes = ["maintenance", "damage_repair"];
$statuses = ["created", "in_progress", "completed", "in_progress", "created"];

$conn->begin_transaction();

try {
    $conn->query("DELETE FROM job_updates");
    $conn->query("DELETE FROM jobs");
    $conn->query("DELETE FROM vehicles");
    $conn->query("DELETE FROM users WHERE role <> 'admin'");

    $staffIds = [];

    for ($i = 0; $i < 10; $i++) {
        $staffIds[] = createUser(
            $conn,
            $staffFirstNames[$i],
            $staffLastNames[$i],
            "06770010" . str_pad((string) ($i + 1), 2, "0", STR_PAD_LEFT),
            "staff" . ($i + 1) . "@mechanic.test",
            "STF" . str_pad((string) ($i + 1), 3, "0", STR_PAD_LEFT),
            "staff"
        );
    }

    $clientIds = [];

    for ($i = 0; $i < 40; $i++) {
        $clientIds[] = createUser(
            $conn,
            $clientFirstNames[$i],
            $clientLastNames[$i],
            "069880" . str_pad((string) ($i + 1), 4, "0", STR_PAD_LEFT),
            "client" . ($i + 1) . "@mechanic.test",
            null,
            "client"
        );
    }

    $vehiclesCreated = 0;
    $jobsCreated = 0;

    for ($i = 0; $i < 50; $i++) {
        $clientIndex = $i < 40 ? $i : $i - 40;
        $clientId = $clientIds[$clientIndex];
        $plateNumber = makePlate($i);
        $vehicleId = createVehicle(
            $conn,
            $clientId,
            $carModelIds[$i % count($carModelIds)],
            $plateNumber,
            "SEED-CLEAN-VIN-" . str_pad((string) ($i + 1), 5, "0", STR_PAD_LEFT)
        );

        $vehiclesCreated++;

        $staffId = $staffIds[$i % count($staffIds)];
        $description = "Pune testuese #" . ($i + 1) . " per automjetin " . $plateNumber;

        createJob(
            $conn,
            $clientId,
            $vehicleId,
            $staffId,
            $adminId,
            $description,
            $jobTypes[$i % count($jobTypes)],
            $statuses[$i % count($statuses)]
        );

        $jobsCreated++;
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Database reset complete. Only admin users were kept.",
        "rule" => "Every jobs.client_id matches vehicles.client_id for the same jobs.vehicle_id.",
        "staff_created" => count($staffIds),
        "clients_created" => count($clientIds),
        "vehicles_created" => $vehiclesCreated,
        "jobs_created" => $jobsCreated,
        "jobs_per_staff" => "5 jobs for each of the 10 staff members"
    ], JSON_PRETTY_PRINT);
} catch (Throwable $error) {
    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => "Reset failed.",
        "error" => $error->getMessage()
    ], JSON_PRETTY_PRINT);
}

?>
