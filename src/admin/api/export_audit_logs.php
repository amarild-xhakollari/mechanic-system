<?php

require_once __DIR__ . "/../../auth/session.php";
requireAdminJson();

$conn = require __DIR__ . "/../../config/db.php";

header("Content-Type: text/csv; charset=utf-8");
header("Content-Disposition: attachment; filename=audit-logs-" . date("Y-m-d") . ".csv");

function export_audit_action_label($action) {
    return [
        "insert" => "Create",
        "update" => "Update",
        "delete" => "Delete",
        "login" => "Login"
    ][strtolower($action ?? "")] ?? ucfirst(strtolower($action ?? "Log"));
}

function export_audit_entity_label($entityType) {
    return [
        "auth" => "Hyrje ne sistem",
        "users" => "Perdorues",
        "jobs" => "Pune",
        "job_services" => "Sherbim",
        "vehicles" => "Makine"
    ][$entityType] ?? ucfirst(str_replace("_", " ", $entityType ?: "Log"));
}

$output = fopen("php://output", "w");
fputcsv($output, ["Koha", "Veprimi", "Entiteti", "Konteksti", "Aktori", "Roli", "Status", "Pershkrimi"]);

$result = $conn->query("
    SELECT
        audit.created_at,
        audit.action,
        audit.entity_type,
        audit.entity_label,
        audit.description,
        audit.status,
        COALESCE(audit.actor_role, actor_user.role, 'system') AS actor_role,
        CONCAT(actor_user.first_name, ' ', actor_user.last_name) AS actor_name
    FROM audit_log audit
    LEFT JOIN users actor_user ON actor_user.user_id = audit.actor_user_id
    ORDER BY audit.created_at DESC
");

if ($result) {
    while ($row = $result->fetch_assoc()) {
        fputcsv($output, [
            $row["created_at"],
            export_audit_action_label($row["action"]),
            export_audit_entity_label($row["entity_type"]),
            preg_replace("/\\s*#\\d+\\b/", "", $row["entity_label"] ?? ""),
            trim($row["actor_name"] ?? "") ?: "System",
            $row["actor_role"],
            $row["status"],
            preg_replace("/\\s*#\\d+\\b/", "", $row["description"] ?? "")
        ]);
    }
}

fclose($output);

?>
