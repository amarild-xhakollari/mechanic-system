<?php

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$conn = require __DIR__ . "/../src/config/db.php";
$conn->set_charset("utf8mb4");

function run_query(mysqli $conn, string $sql): void {
    $conn->query($sql);
}

function table_exists(mysqli $conn, string $table): bool {
    $escaped = $conn->real_escape_string($table);
    $result = $conn->query("SHOW TABLES LIKE '$escaped'");

    return $result && $result->num_rows > 0;
}

function column_exists(mysqli $conn, string $table, string $column): bool {
    $escapedTable = $conn->real_escape_string($table);
    $escapedColumn = $conn->real_escape_string($column);
    $result = $conn->query("SHOW COLUMNS FROM `$escapedTable` LIKE '$escapedColumn'");

    return $result && $result->num_rows > 0;
}

function index_exists(mysqli $conn, string $table, string $index): bool {
    $escapedTable = $conn->real_escape_string($table);
    $escapedIndex = $conn->real_escape_string($index);
    $result = $conn->query("SHOW INDEX FROM `$escapedTable` WHERE Key_name = '$escapedIndex'");

    return $result && $result->num_rows > 0;
}

function add_column_if_missing(mysqli $conn, string $column, string $definition): void {
    if (!column_exists($conn, "audit_log", $column)) {
        run_query($conn, "ALTER TABLE audit_log ADD COLUMN $definition");
    }
}

function drop_index_if_exists(mysqli $conn, string $index): void {
    if (index_exists($conn, "audit_log", $index)) {
        run_query($conn, "ALTER TABLE audit_log DROP INDEX `$index`");
    }
}

function drop_column_if_exists(mysqli $conn, string $column): void {
    if (column_exists($conn, "audit_log", $column)) {
        run_query($conn, "ALTER TABLE audit_log DROP COLUMN `$column`");
    }
}

if (!table_exists($conn, "audit_log")) {
    run_query($conn, "
        CREATE TABLE audit_log (
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
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
} else {
    add_column_if_missing($conn, "actor_user_id", "actor_user_id INT NULL AFTER audit_id");
    add_column_if_missing($conn, "actor_role", "actor_role VARCHAR(30) NULL AFTER actor_user_id");
    add_column_if_missing($conn, "entity_type", "entity_type VARCHAR(50) NULL AFTER action");
    add_column_if_missing($conn, "entity_label", "entity_label VARCHAR(160) NULL AFTER entity_id");
    add_column_if_missing($conn, "description", "description TEXT NULL AFTER entity_label");
    add_column_if_missing($conn, "old_values", "old_values JSON NULL AFTER description");
    add_column_if_missing($conn, "new_values", "new_values JSON NULL AFTER old_values");
    add_column_if_missing($conn, "changed_fields", "changed_fields JSON NULL AFTER new_values");
    add_column_if_missing($conn, "request_method", "request_method VARCHAR(10) NULL AFTER changed_fields");
    add_column_if_missing($conn, "request_path", "request_path VARCHAR(255) NULL AFTER request_method");
    add_column_if_missing($conn, "ip_address", "ip_address VARCHAR(45) NULL AFTER request_path");
    add_column_if_missing($conn, "user_agent", "user_agent TEXT NULL AFTER ip_address");
    add_column_if_missing($conn, "session_id_hash", "session_id_hash VARCHAR(128) NULL AFTER user_agent");
    add_column_if_missing($conn, "status", "status ENUM('success','failed') NOT NULL DEFAULT 'success' AFTER session_id_hash");
    add_column_if_missing($conn, "error_message", "error_message TEXT NULL AFTER status");
}

$hasOldEntityName = column_exists($conn, "audit_log", "entity_name");
$hasOldUserId = column_exists($conn, "audit_log", "user_id");
$hasOldData = column_exists($conn, "audit_log", "old_data");
$hasNewData = column_exists($conn, "audit_log", "new_data");

if ($hasOldUserId) {
    run_query($conn, "
        UPDATE audit_log
        SET actor_user_id = COALESCE(actor_user_id, user_id)
        WHERE actor_user_id IS NULL
    ");
}

if ($hasOldEntityName) {
    run_query($conn, "
        UPDATE audit_log
        SET entity_type = COALESCE(entity_type, entity_name)
        WHERE entity_type IS NULL OR entity_type = ''
    ");
}

if ($hasOldData) {
    run_query($conn, "
        UPDATE audit_log
        SET old_values = COALESCE(old_values, old_data)
        WHERE old_values IS NULL
    ");
}

if ($hasNewData) {
    run_query($conn, "
        UPDATE audit_log
        SET new_values = COALESCE(new_values, new_data)
        WHERE new_values IS NULL
    ");
}

run_query($conn, "
    UPDATE audit_log audit
    LEFT JOIN users actor_user ON actor_user.user_id = audit.actor_user_id
    SET audit.actor_role = COALESCE(audit.actor_role, actor_user.role, 'system')
    WHERE audit.actor_role IS NULL OR audit.actor_role = ''
");

run_query($conn, "
    UPDATE audit_log
    SET entity_type = COALESCE(NULLIF(entity_type, ''), 'system'),
        entity_label = COALESCE(entity_label, CONCAT(entity_type, IF(entity_id IS NULL, '', CONCAT(' #', entity_id)))),
        description = COALESCE(description, CONCAT(action, ' ne ', entity_type, IF(entity_id IS NULL, '', CONCAT(' #', entity_id)))),
        status = COALESCE(status, 'success')
");

run_query($conn, "
    ALTER TABLE audit_log
    MODIFY action VARCHAR(40) NOT NULL,
    MODIFY entity_type VARCHAR(50) NOT NULL
");

if (!index_exists($conn, "audit_log", "idx_audit_actor")) {
    run_query($conn, "CREATE INDEX idx_audit_actor ON audit_log (actor_user_id)");
}

if (!index_exists($conn, "audit_log", "idx_audit_entity")) {
    run_query($conn, "CREATE INDEX idx_audit_entity ON audit_log (entity_type, entity_id)");
}

if (!index_exists($conn, "audit_log", "idx_audit_action")) {
    run_query($conn, "CREATE INDEX idx_audit_action ON audit_log (action)");
}

if (!index_exists($conn, "audit_log", "idx_audit_created_at")) {
    run_query($conn, "CREATE INDEX idx_audit_created_at ON audit_log (created_at)");
}

drop_index_if_exists($conn, "idx_audit_log_entity");
drop_index_if_exists($conn, "idx_audit_log_user_id");
drop_column_if_exists($conn, "entity_name");
drop_column_if_exists($conn, "user_id");
drop_column_if_exists($conn, "old_data");
drop_column_if_exists($conn, "new_data");

$count = (int) $conn->query("SELECT COUNT(*) AS total FROM audit_log")->fetch_assoc()["total"];

echo json_encode([
    "success" => true,
    "message" => "audit_log migrated to v2.",
    "audit_logs" => $count
], JSON_PRETTY_PRINT) . PHP_EOL;

?>
