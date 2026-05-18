<?php

require_once __DIR__ . "/../../auth/session.php";
requireAdminJson();

$mysqli = require __DIR__ . "/../../config/db.php";

header("Content-Type: application/json");

function audit_logs_table_exists($conn) {
    $result = $conn->query("SHOW TABLES LIKE 'audit_log'");
    return $result && $result->num_rows > 0;
}

function audit_entity_label($entity) {
    $labels = [
        "auth" => "Login ne sistem",
        "jobs" => "Job",
        "job_services" => "Service",
        "users" => "Perdorues",
        "vehicles" => "Makina"
    ];

    return $labels[$entity] ?? ucfirst(str_replace("_", " ", $entity ?: "log"));
}

function audit_action_label($action) {
    $labels = [
        "insert" => "Create",
        "update" => "Update",
        "delete" => "Delete",
        "login" => "Login"
    ];

    return $labels[strtolower($action ?? "")] ?? ucfirst(strtolower($action ?? "Log"));
}

function has_raw_audit_words($value) {
    return preg_match("/\\b(users|jobs|job_services|vehicles|INSERT|UPDATE|DELETE|LOGIN)\\b/i", (string) $value) === 1;
}

function clean_audit_display_text($value) {
    return trim(preg_replace("/\\s*#\\d+\\b/", "", (string) ($value ?? "")));
}

if (!audit_logs_table_exists($mysqli)) {
    echo json_encode(["logs" => []]);
    exit;
}

$sql = "
    SELECT
        audit.audit_id,
        audit.entity_type,
        audit.entity_id,
        audit.entity_label,
        audit.action,
        audit.actor_user_id,
        COALESCE(audit.actor_role, actor_user.role, 'system') AS actor_role,
        audit.description,
        audit.status,
        audit.created_at,
        audit.new_values,
        CONCAT(actor_user.first_name, ' ', actor_user.last_name) AS user_name,
        CONCAT(target_user.first_name, ' ', target_user.last_name) AS target_user_name,
        target_user.role AS target_user_role,
        job.description AS job_description,
        job.job_type AS job_type,
        service.title AS service_title,
        service.job_id AS service_job_id,
        service_job.description AS service_job_description,
        job_vehicle.plate_number AS job_plate_number,
        service_vehicle.plate_number AS service_job_plate_number,
        vehicle.plate_number,
        vehicle.vin
    FROM audit_log audit
    LEFT JOIN users actor_user ON actor_user.user_id = audit.actor_user_id
    LEFT JOIN users target_user
        ON target_user.user_id = audit.entity_id
        AND audit.entity_type IN ('users', 'auth')
    LEFT JOIN jobs job
        ON job.job_id = audit.entity_id
        AND audit.entity_type = 'jobs'
    LEFT JOIN job_services service
        ON service.service_id = audit.entity_id
        AND audit.entity_type = 'job_services'
    LEFT JOIN jobs service_job ON service_job.job_id = service.job_id
    LEFT JOIN vehicles job_vehicle ON job_vehicle.vehicle_id = job.vehicle_id
    LEFT JOIN vehicles service_vehicle ON service_vehicle.vehicle_id = service_job.vehicle_id
    LEFT JOIN vehicles vehicle
        ON vehicle.vehicle_id = audit.entity_id
        AND audit.entity_type = 'vehicles'
    ORDER BY audit.created_at DESC
    LIMIT 100
";

$result = $mysqli->query($sql);
$logs = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $entity = $row["entity_type"] ?? "system";
        $action = $row["action"] ?? "LOG";
        $entityId = $row["entity_id"] ?? "";
        $description = clean_audit_display_text($row["description"] ?? "");
        $targetRole = $row["target_user_role"] ?? "";
        $newValues = json_decode($row["new_values"] ?? "", true);

        if (!$targetRole && is_array($newValues)) {
            $targetRole = $newValues["role"] ?? "";
        }

        $contextLabel = audit_entity_label($entity);
        $serviceJobId = $row["service_job_id"] ?? (is_array($newValues) ? ($newValues["job_id"] ?? null) : null);
        $serviceTitle = $row["service_title"] ?? (is_array($newValues) ? ($newValues["title"] ?? null) : null);

        if ($entity === "auth") {
            $contextLabel = "Login ne sistem";
        } elseif ($entity === "job_services") {
            $jobPlate = $row["service_job_plate_number"] ?? "";
            $jobLabel = "Job: " . ($jobPlate ?: "pa targe");
            $contextLabel = $jobLabel;
        } elseif ($entity === "jobs") {
            $contextLabel = "Job: " . ($row["job_plate_number"] ?: "pa targe");
        } elseif ($entity === "users") {
            $roleLabel = [
                "client" => "Klient",
                "staff" => "Staf",
                "admin" => "Admin"
            ][$targetRole] ?? "Perdorues";
            $contextLabel = $roleLabel . ($row["target_user_name"] ? " - " . trim($row["target_user_name"]) : "");
        } elseif ($entity === "vehicles") {
            $contextLabel = $row["plate_number"] ? "Makina " . $row["plate_number"] : ($row["vin"] ? "Makina VIN " . $row["vin"] : "Makina");
        }

        $displaySummary = $description;
        if ($displaySummary === "" || has_raw_audit_words($displaySummary)) {
            $displaySummary = audit_action_label($action) . " " . $contextLabel;
        }

        $logs[] = [
            "id" => (int) $row["audit_id"],
            "entity" => $entity,
            "entityId" => $entityId,
            "entityLabel" => $contextLabel,
            "contextLabel" => $contextLabel,
            "targetRole" => $targetRole,
            "serviceTitle" => $serviceTitle,
            "serviceJobId" => $serviceJobId !== null ? (int) $serviceJobId : null,
            "action" => $action,
            "actor" => trim($row["user_name"] ?? "") ?: "System",
            "actorRole" => $row["actor_role"] ?: "system",
            "status" => $row["status"] ?: "success",
            "date" => $row["created_at"],
            "summary" => $displaySummary
        ];
    }
}

echo json_encode(["logs" => $logs]);

?>
