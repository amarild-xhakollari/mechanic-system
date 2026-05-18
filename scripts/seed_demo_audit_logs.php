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

function fetch_ids(mysqli $conn, string $sql): array {
    $ids = [];
    $result = $conn->query($sql);

    while ($row = $result->fetch_assoc()) {
        $ids[] = (int) array_values($row)[0];
    }

    return $ids;
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

ensure_audit_log_table($conn);

$count = (int) $conn->query("SELECT COUNT(*) AS total FROM audit_log")->fetch_assoc()["total"];

if ($count > 0) {
    echo json_encode([
        "success" => true,
        "message" => "Audit logs already exist; no demo logs inserted.",
        "audit_logs" => $count
    ], JSON_PRETTY_PRINT) . PHP_EOL;
    exit;
}

$adminIds = fetch_ids($conn, "SELECT user_id FROM users WHERE role = 'admin' ORDER BY user_id LIMIT 1");
$staffIds = fetch_ids($conn, "SELECT user_id FROM users WHERE role = 'staff' ORDER BY user_id LIMIT 5");
$clientIds = fetch_ids($conn, "SELECT user_id FROM users WHERE role = 'client' ORDER BY user_id LIMIT 5");
$vehicleIds = fetch_ids($conn, "SELECT vehicle_id FROM vehicles ORDER BY vehicle_id LIMIT 5");
$jobIds = fetch_ids($conn, "SELECT job_id FROM jobs ORDER BY job_id LIMIT 8");
$serviceIds = fetch_ids($conn, "SELECT service_id FROM job_services ORDER BY service_id LIMIT 8");

$adminId = $adminIds[0] ?? 1;
$staffId = $staffIds[0] ?? $adminId;
$clientId = $clientIds[0] ?? $adminId;

$stmt = $conn->prepare("
    INSERT INTO audit_log
        (action, entity_type, entity_id, entity_label, description, actor_user_id, actor_role, old_values, new_values, changed_fields, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$now = time();

insert_audit_log($stmt, "auth", $adminId, "LOGIN", $adminId, null, [
    "role" => "admin",
    "demo_seed" => true
], date("Y-m-d H:i:s", $now - 7200));

foreach ($staffIds as $index => $id) {
    insert_audit_log($stmt, "users", $id, "INSERT", $adminId, null, [
        "role" => "staff",
        "demo_seed" => true
    ], date("Y-m-d H:i:s", $now - 6800 + ($index * 120)));
}

foreach ($clientIds as $index => $id) {
    insert_audit_log($stmt, "users", $id, "INSERT", $adminId, null, [
        "role" => "client",
        "demo_seed" => true
    ], date("Y-m-d H:i:s", $now - 6100 + ($index * 120)));
}

foreach ($vehicleIds as $index => $id) {
    insert_audit_log($stmt, "vehicles", $id, "INSERT", $adminId, null, [
        "demo_seed" => true
    ], date("Y-m-d H:i:s", $now - 5400 + ($index * 120)));
}

foreach ($jobIds as $index => $id) {
    $action = $index % 3 === 0 ? "UPDATE" : "INSERT";
    insert_audit_log($stmt, "jobs", $id, $action, $index % 2 === 0 ? $adminId : $staffId, [
        "status" => $action === "UPDATE" ? "created" : null,
        "demo_seed" => true
    ], [
        "status" => $action === "UPDATE" ? "in_progress" : "created",
        "demo_seed" => true
    ], date("Y-m-d H:i:s", $now - 4500 + ($index * 150)));
}

foreach ($serviceIds as $index => $id) {
    insert_audit_log($stmt, "job_services", $id, "INSERT", $staffId, null, [
        "status" => "active",
        "demo_seed" => true
    ], date("Y-m-d H:i:s", $now - 3000 + ($index * 150)));
}

insert_audit_log($stmt, "auth", $staffId, "LOGIN", $staffId, null, [
    "role" => "staff",
    "demo_seed" => true
], date("Y-m-d H:i:s", $now - 900));

insert_audit_log($stmt, "auth", $clientId, "LOGIN", $clientId, null, [
    "role" => "client",
    "demo_seed" => true
], date("Y-m-d H:i:s", $now - 420));

$total = (int) $conn->query("SELECT COUNT(*) AS total FROM audit_log")->fetch_assoc()["total"];

echo json_encode([
    "success" => true,
    "message" => "Demo audit logs inserted successfully.",
    "audit_logs" => $total
], JSON_PRETTY_PRINT) . PHP_EOL;

?>
