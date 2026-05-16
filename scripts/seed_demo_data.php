<?php

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$conn = require __DIR__ . "/../src/config/db.php";
$conn->set_charset("utf8mb4");

function run_query(mysqli $conn, string $sql): void {
    $conn->query($sql);
}

function column_exists(mysqli $conn, string $table, string $column): bool {
    $escapedTable = $conn->real_escape_string($table);
    $escapedColumn = $conn->real_escape_string($column);
    $result = $conn->query("SHOW COLUMNS FROM `$escapedTable` LIKE '$escapedColumn'");

    return $result && $result->num_rows > 0;
}

function add_audit_column_if_missing(mysqli $conn, string $column, string $definition): void {
    if (!column_exists($conn, "audit_log", $column)) {
        run_query($conn, "ALTER TABLE audit_log ADD COLUMN $definition");
    }
}

function get_count(mysqli $conn, string $sql): int {
    $result = $conn->query($sql);
    $row = $result->fetch_assoc();

    return (int) ($row["total"] ?? 0);
}

function ensure_job_services_table(mysqli $conn): void {
    run_query($conn, "
        CREATE TABLE IF NOT EXISTS job_services (
            service_id INT AUTO_INCREMENT PRIMARY KEY,
            job_id INT NOT NULL,
            created_by INT NOT NULL,
            title VARCHAR(160) NOT NULL,
            description TEXT NOT NULL,
            image_path VARCHAR(255) NULL,
            status ENUM('active', 'deleted') NOT NULL DEFAULT 'active',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL,
            CONSTRAINT fk_job_services_job
                FOREIGN KEY (job_id) REFERENCES jobs(job_id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
            CONSTRAINT fk_job_services_created_by
                FOREIGN KEY (created_by) REFERENCES users(user_id)
                ON DELETE RESTRICT
                ON UPDATE CASCADE,
            INDEX idx_job_services_job_id (job_id),
            INDEX idx_job_services_created_by (created_by),
            INDEX idx_job_services_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function ensure_audit_log_table(mysqli $conn): void {
    run_query($conn, "
        CREATE TABLE IF NOT EXISTS audit_log (
            audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            actor_user_id INT NULL,
            actor_role VARCHAR(30) NULL,
            action VARCHAR(40) NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            entity_id INT NULL,
            entity_label VARCHAR(160) NULL,
            description TEXT NULL,
            old_values JSON NULL,
            new_values JSON NULL,
            changed_fields JSON NULL,
            request_method VARCHAR(10) NULL,
            request_path VARCHAR(255) NULL,
            ip_address VARCHAR(45) NULL,
            user_agent TEXT NULL,
            session_id_hash VARCHAR(128) NULL,
            status ENUM('success','failed') NOT NULL DEFAULT 'success',
            error_message TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_audit_actor (actor_user_id),
            INDEX idx_audit_entity (entity_type, entity_id),
            INDEX idx_audit_action (action),
            INDEX idx_audit_log_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    add_audit_column_if_missing($conn, "actor_user_id", "actor_user_id INT NULL AFTER audit_id");
    add_audit_column_if_missing($conn, "actor_role", "actor_role VARCHAR(30) NULL AFTER actor_user_id");
    add_audit_column_if_missing($conn, "entity_type", "entity_type VARCHAR(50) NULL AFTER action");
    add_audit_column_if_missing($conn, "entity_label", "entity_label VARCHAR(160) NULL AFTER entity_id");
    add_audit_column_if_missing($conn, "description", "description TEXT NULL AFTER entity_label");
    add_audit_column_if_missing($conn, "old_values", "old_values JSON NULL AFTER description");
    add_audit_column_if_missing($conn, "new_values", "new_values JSON NULL AFTER old_values");
    add_audit_column_if_missing($conn, "changed_fields", "changed_fields JSON NULL AFTER new_values");
    add_audit_column_if_missing($conn, "request_method", "request_method VARCHAR(10) NULL AFTER changed_fields");
    add_audit_column_if_missing($conn, "request_path", "request_path VARCHAR(255) NULL AFTER request_method");
    add_audit_column_if_missing($conn, "ip_address", "ip_address VARCHAR(45) NULL AFTER request_path");
    add_audit_column_if_missing($conn, "user_agent", "user_agent TEXT NULL AFTER ip_address");
    add_audit_column_if_missing($conn, "session_id_hash", "session_id_hash VARCHAR(128) NULL AFTER user_agent");
    add_audit_column_if_missing($conn, "status", "status ENUM('success','failed') NOT NULL DEFAULT 'success' AFTER session_id_hash");
    add_audit_column_if_missing($conn, "error_message", "error_message TEXT NULL AFTER status");
}

function ensure_carmodels(mysqli $conn): array {
    $ids = [];
    $result = $conn->query("SELECT id FROM carsmodels ORDER BY id ASC LIMIT 40");
    while ($row = $result->fetch_assoc()) {
        $ids[] = (int) $row["id"];
    }

    if (count($ids) > 0) {
        return $ids;
    }

    $models = [
        ["Toyota", "Corolla", "1.8 Hybrid"],
        ["Volkswagen", "Golf", "2.0 TDI"],
        ["Mercedes-Benz", "C-Class", "2.0 Diesel"],
        ["BMW", "3 Series", "2.0 Petrol"],
        ["Audi", "A4", "2.0 TFSI"]
    ];

    $stmt = $conn->prepare("
        INSERT INTO carsmodels
            (company_name, car_name, engines, capacity, horsepower, total_speed, performance, fuel_type, seats, torque)
        VALUES (?, ?, ?, '1800cc', '150hp', '210km/h', 'Standard', 'Petrol', 5, '250Nm')
    ");

    foreach ($models as $model) {
        $stmt->bind_param("sss", $model[0], $model[1], $model[2]);
        $stmt->execute();
        $ids[] = (int) $conn->insert_id;
    }

    return $ids;
}

function create_seed_images(): array {
    $dir = __DIR__ . "/../public/uploads/job-services";
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }

    $colors = [
        ["#1d1917", "#f4c542", "Oil"],
        ["#27374d", "#9db2bf", "Brake"],
        ["#245953", "#d8f3dc", "Filter"],
        ["#5f264a", "#f7d6e0", "Engine"],
        ["#3a4d39", "#ece3ce", "Tires"],
        ["#7d2e2e", "#ffe1a8", "Battery"],
        ["#314e52", "#e7e6e1", "AC"],
        ["#4f4557", "#f4eee0", "Diag"]
    ];

    $paths = [];
    foreach ($colors as $index => $item) {
        [$bg, $fg, $label] = $item;
        $name = "seed-service-" . ($index + 1) . ".svg";
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">'
            . '<rect width="900" height="620" rx="28" fill="' . $bg . '"/>'
            . '<circle cx="720" cy="150" r="92" fill="' . $fg . '" opacity="0.92"/>'
            . '<rect x="90" y="120" width="520" height="320" rx="26" fill="#ffffff" opacity="0.92"/>'
            . '<rect x="140" y="185" width="420" height="36" rx="18" fill="' . $bg . '" opacity="0.22"/>'
            . '<rect x="140" y="255" width="300" height="36" rx="18" fill="' . $bg . '" opacity="0.22"/>'
            . '<rect x="140" y="325" width="360" height="36" rx="18" fill="' . $bg . '" opacity="0.22"/>'
            . '<text x="96" y="535" fill="#ffffff" font-family="Arial, sans-serif" font-size="64" font-weight="700">' . $label . ' Service</text>'
            . '</svg>';

        file_put_contents($dir . "/" . $name, $svg);
        $paths[] = "public/uploads/job-services/" . $name;
    }

    return $paths;
}

function insert_user(mysqli $conn, array $user, string $password): int {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("
        INSERT INTO users
            (first_name, last_name, phone_number, email, login_identifier, role, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "sssssss",
        $user["first_name"],
        $user["last_name"],
        $user["phone"],
        $user["email"],
        $user["login_identifier"],
        $user["role"],
        $hash
    );
    $stmt->execute();

    return (int) $conn->insert_id;
}

function insert_audit_log(
    mysqli_stmt $stmt,
    string $entityName,
    int $entityId,
    string $action,
    int $userId,
    ?array $oldData,
    ?array $newData,
    string $createdAt
): void {
    $oldJson = $oldData ? json_encode($oldData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null;
    $newJson = $newData ? json_encode($newData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null;
    $changedFields = [];

    if ($oldData && $newData) {
        $changedFields = array_values(array_unique(array_merge(array_keys($oldData), array_keys($newData))));
    } elseif ($newData) {
        $changedFields = array_keys($newData);
    }

    $changedJson = count($changedFields) > 0 ? json_encode($changedFields, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null;
    $entityLabel = $entityName . " #" . $entityId;
    $description = $action . " ne " . $entityLabel;
    $actorRole = null;
    $status = "success";

    $stmt->bind_param("ssississssss", $action, $entityName, $entityId, $entityLabel, $description, $userId, $actorRole, $oldJson, $newJson, $changedJson, $status, $createdAt);
    $stmt->execute();
}

ensure_job_services_table($conn);
ensure_audit_log_table($conn);
$modelIds = ensure_carmodels($conn);
$serviceImages = create_seed_images();

$conn->begin_transaction();

try {
    run_query($conn, "SET FOREIGN_KEY_CHECKS = 0");
    foreach (["job_services", "job_updates", "audit_log", "jobs", "vehicles", "users"] as $table) {
        run_query($conn, "TRUNCATE TABLE $table");
    }
    run_query($conn, "SET FOREIGN_KEY_CHECKS = 1");

    $adminId = insert_user($conn, [
        "first_name" => "Admin",
        "last_name" => "Demo",
        "phone" => "0690000001",
        "email" => "admin.demo@mechanic.test",
        "login_identifier" => "admin01",
        "role" => "admin"
    ], "admin123");

    $auditStmt = $conn->prepare("
        INSERT INTO audit_log
            (action, entity_type, entity_id, entity_label, description, actor_user_id, actor_role, old_values, new_values, changed_fields, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    insert_audit_log($auditStmt, "users", $adminId, "INSERT", $adminId, null, [
        "role" => "admin",
        "login_identifier" => "admin01",
        "email" => "admin.demo@mechanic.test"
    ], date("Y-m-d H:i:s", strtotime("-46 days")));

    insert_audit_log($auditStmt, "auth", $adminId, "LOGIN", $adminId, null, [
        "login_identifier" => "admin01",
        "role" => "admin"
    ], date("Y-m-d H:i:s", strtotime("-45 days -2 hours")));

    $staffIds = [];
    for ($i = 1; $i <= 10; $i++) {
        $staffId = insert_user($conn, [
            "first_name" => "Staff",
            "last_name" => str_pad((string) $i, 2, "0", STR_PAD_LEFT),
            "phone" => "06770010" . str_pad((string) $i, 2, "0", STR_PAD_LEFT),
            "email" => "staff" . str_pad((string) $i, 2, "0", STR_PAD_LEFT) . "@mechanic.test",
            "login_identifier" => "staff" . str_pad((string) $i, 2, "0", STR_PAD_LEFT),
            "role" => "staff"
        ], "staff123");
        $staffIds[] = $staffId;

        if ($i <= 5) {
            insert_audit_log($auditStmt, "users", $staffId, "INSERT", $adminId, null, [
                "role" => "staff",
                "login_identifier" => "staff" . str_pad((string) $i, 2, "0", STR_PAD_LEFT)
            ], date("Y-m-d H:i:s", strtotime("-45 days +" . $i . " minutes")));
        }
    }

    $clientIds = [];
    for ($i = 1; $i <= 20; $i++) {
        $clientId = insert_user($conn, [
            "first_name" => "Client",
            "last_name" => str_pad((string) $i, 2, "0", STR_PAD_LEFT),
            "phone" => "06880020" . str_pad((string) $i, 2, "0", STR_PAD_LEFT),
            "email" => "client" . str_pad((string) $i, 2, "0", STR_PAD_LEFT) . "@mechanic.test",
            "login_identifier" => "client" . str_pad((string) $i, 2, "0", STR_PAD_LEFT),
            "role" => "client"
        ], "client123");
        $clientIds[] = $clientId;

        if ($i <= 6) {
            insert_audit_log($auditStmt, "users", $clientId, "INSERT", $adminId, null, [
                "role" => "client",
                "phone_number" => "06880020" . str_pad((string) $i, 2, "0", STR_PAD_LEFT)
            ], date("Y-m-d H:i:s", strtotime("-44 days +" . $i . " minutes")));
        }
    }

    $vehicleIds = [];
    $vehicleStmt = $conn->prepare("
        INSERT INTO vehicles (client_id, car_model_id, plate_number, vin)
        VALUES (?, ?, ?, ?)
    ");

    foreach ($clientIds as $index => $clientId) {
        $modelId = $modelIds[$index % count($modelIds)];
        $plate = "AA" . str_pad((string) ($index + 101), 3, "0", STR_PAD_LEFT) . "BB";
        $vin = "VINDEMO" . str_pad((string) ($index + 1), 10, "0", STR_PAD_LEFT);
        $vehicleStmt->bind_param("iiss", $clientId, $modelId, $plate, $vin);
        $vehicleStmt->execute();
        $vehicleId = (int) $conn->insert_id;
        $vehicleIds[] = $vehicleId;

        if ($index < 8) {
            insert_audit_log($auditStmt, "vehicles", $vehicleId, "INSERT", $adminId, null, [
                "client_id" => $clientId,
                "plate_number" => $plate,
                "vin" => $vin
            ], date("Y-m-d H:i:s", strtotime("-43 days +" . ($index + 1) . " minutes")));
        }
    }

    $jobStmt = $conn->prepare("
        INSERT INTO jobs
            (client_id, vehicle_id, staff_id, created_by, description, job_type, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $updateStmt = $conn->prepare("
        INSERT INTO job_updates
            (job_id, updated_by, old_status, new_status, note, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $serviceStmt = $conn->prepare("
        INSERT INTO job_services
            (job_id, created_by, title, description, image_path, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
    ");

    $serviceTitles = [
        "Nderrim vaji motorri",
        "Kontroll frenash",
        "Zevendesim filtri ajri",
        "Diagnostikim motorri",
        "Balancim gomash",
        "Kontroll baterie",
        "Servis kondicioneri",
        "Kontroll elektronik"
    ];

    for ($i = 0; $i < 30; $i++) {
        $clientId = $clientIds[$i % count($clientIds)];
        $vehicleId = $vehicleIds[$i % count($vehicleIds)];
        $staffId = $staffIds[$i % count($staffIds)];
        $status = $i % 4 === 0 ? "completed" : ($i % 3 === 0 ? "in_progress" : "created");
        $jobType = $i % 2 === 0 ? "maintenance" : "damage_repair";
        $createdAt = date("Y-m-d H:i:s", strtotime("-" . (45 - $i) . " days"));
        $updatedAt = $status === "completed"
            ? date("Y-m-d H:i:s", strtotime($createdAt . " +2 days"))
            : date("Y-m-d H:i:s", strtotime($createdAt . " +6 hours"));
        $description = $jobType === "maintenance"
            ? "Servisim periodik dhe kontroll i pergjithshem i automjetit."
            : "Riparim demtimi dhe kontroll pas nderhyrjes.";

        $jobStmt->bind_param(
            "iiiisssss",
            $clientId,
            $vehicleId,
            $staffId,
            $adminId,
            $description,
            $jobType,
            $status,
            $createdAt,
            $updatedAt
        );
        $jobStmt->execute();
        $jobId = (int) $conn->insert_id;

        insert_audit_log($auditStmt, "jobs", $jobId, "INSERT", $adminId, null, [
            "client_id" => $clientId,
            "vehicle_id" => $vehicleId,
            "staff_id" => $staffId,
            "status" => $status,
            "job_type" => $jobType
        ], $createdAt);

        $oldStatus = "created";
        $newStatus = "created";
        $note = "Job u krijua nga admini demo.";
        $updateStmt->bind_param("iissss", $jobId, $adminId, $oldStatus, $newStatus, $note, $createdAt);
        $updateStmt->execute();

        $servicesForJob = $status === "created" ? 1 : (($i % 3) + 2);
        for ($s = 0; $s < $servicesForJob; $s++) {
            $title = $serviceTitles[($i + $s) % count($serviceTitles)];
            $serviceDescription = "U krye " . strtolower($title) . " dhe u dokumentua gjendja e automjetit pas sherbimit.";
            $imagePath = $serviceImages[($i + $s) % count($serviceImages)];
            $serviceAt = date("Y-m-d H:i:s", strtotime($createdAt . " +" . ($s + 3) . " hours"));

            $serviceStmt->bind_param(
                "iisssss",
                $jobId,
                $staffId,
                $title,
                $serviceDescription,
                $imagePath,
                $serviceAt,
                $serviceAt
            );
            $serviceStmt->execute();
            $serviceId = (int) $conn->insert_id;

            insert_audit_log($auditStmt, "job_services", $serviceId, "INSERT", $staffId, null, [
                "job_id" => $jobId,
                "title" => $title,
                "status" => "active"
            ], $serviceAt);

            $serviceNote = "U shtua sherbimi: " . $title . ".";
            $updateStmt->bind_param("iissss", $jobId, $staffId, $oldStatus, $status, $serviceNote, $serviceAt);
            $updateStmt->execute();
        }

        if ($status === "completed") {
            $completeNote = "Puna u perfundua pas verifikimit final.";
            $completeAt = date("Y-m-d H:i:s", strtotime($updatedAt . " +1 hour"));
            $previousStatus = "in_progress";
            $completedStatus = "completed";
            $updateStmt->bind_param("iissss", $jobId, $staffId, $previousStatus, $completedStatus, $completeNote, $completeAt);
            $updateStmt->execute();

            insert_audit_log($auditStmt, "jobs", $jobId, "UPDATE", $staffId, [
                "status" => $previousStatus
            ], [
                "status" => $completedStatus
            ], $completeAt);
        }
    }

    insert_audit_log($auditStmt, "auth", $staffIds[0], "LOGIN", $staffIds[0], null, [
        "login_identifier" => "staff01",
        "role" => "staff"
    ], date("Y-m-d H:i:s", strtotime("-1 day +15 minutes")));

    insert_audit_log($auditStmt, "auth", $clientIds[0], "LOGIN", $clientIds[0], null, [
        "phone_number" => "0688002001",
        "role" => "client"
    ], date("Y-m-d H:i:s", strtotime("-1 day +26 minutes")));

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Demo data seeded successfully.",
        "admin" => 1,
        "staff" => count($staffIds),
        "clients" => count($clientIds),
        "jobs" => 30,
        "audit_logs" => get_count($conn, "SELECT COUNT(*) AS total FROM audit_log")
    ], JSON_PRETTY_PRINT) . PHP_EOL;
} catch (Throwable $error) {
    $conn->rollback();
    run_query($conn, "SET FOREIGN_KEY_CHECKS = 1");
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $error->getMessage()
    ], JSON_PRETTY_PRINT) . PHP_EOL;
    exit(1);
}

?>
