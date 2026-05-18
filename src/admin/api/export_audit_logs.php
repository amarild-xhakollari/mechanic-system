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

function export_clean_text($value) {
    return trim(preg_replace("/\\s*#\\d+\\b/", "", (string) ($value ?? "")));
}

function export_audit_log_type($row) {
    $action = strtolower((string) ($row["action"] ?? ""));
    $entity = strtolower((string) ($row["entity_type"] ?? ""));

    if ($action === "login") {
        return "log-in";
    }

    $entityType = [
        "users" => "user",
        "auth" => "user",
        "jobs" => "job",
        "job_updates" => "job",
        "vehicles" => "vehicle",
        "job_services" => "service"
    ][$entity] ?? (rtrim($entity, "s") ?: "log");

    if ($entityType === "user") {
        $targetRole = strtolower((string) ($row["target_user_role"] ?? ""));
        if ($targetRole === "") {
            $newValues = json_decode($row["new_values"] ?? "", true);
            if (is_array($newValues)) {
                $targetRole = strtolower((string) ($newValues["role"] ?? ""));
            }
        }

        if ($targetRole !== "") {
            $entityType = $targetRole;
        }
    }

    if ($action === "insert") {
        return "create-" . $entityType;
    }

    if ($action === "update") {
        return "update-" . $entityType;
    }

    if ($action === "delete") {
        return "delete-" . $entityType;
    }

    return "default";
}

function export_parse_date($value, $endOfDay = false) {
    if (!$value) {
        return null;
    }

    $date = DateTime::createFromFormat("Y-m-d H:i:s", $value . ($endOfDay ? " 23:59:59" : " 00:00:00"));
    return $date ?: null;
}

function export_matches_time_filter($createdAt, $time, $fromDate, $toDate) {
    if ($time === "all" && $fromDate === "" && $toDate === "") {
        return true;
    }

    $logDate = DateTime::createFromFormat("Y-m-d H:i:s", (string) $createdAt);
    if (!$logDate) {
        return $time === "all";
    }

    $now = new DateTime();

    if ($time === "today") {
        $start = (clone $now)->setTime(0, 0, 0);
        return $logDate >= $start;
    }

    if ($time === "7days") {
        $start = (clone $now)->modify("-7 days");
        return $logDate >= $start;
    }

    if ($time === "30days") {
        $start = (clone $now)->modify("-30 days");
        return $logDate >= $start;
    }

    $from = export_parse_date($fromDate);
    $to = export_parse_date($toDate, true);

    if ($from && $logDate < $from) {
        return false;
    }

    if ($to && $logDate > $to) {
        return false;
    }

    return true;
}

function export_row_search_text($row) {
    return strtolower(implode(" ", [
        $row["audit_id"] ?? "",
        $row["entity_type"] ?? "",
        $row["entity_id"] ?? "",
        $row["action"] ?? "",
        $row["actor_name"] ?? "",
        $row["actor_role"] ?? "",
        $row["status"] ?? "",
        $row["entity_label"] ?? "",
        $row["created_at"] ?? "",
        $row["description"] ?? ""
    ]));
}

$search = trim((string) ($_GET["q"] ?? ""));
$type = (string) ($_GET["type"] ?? "all");
$actorRole = strtolower((string) ($_GET["actorRole"] ?? "all"));
$time = (string) ($_GET["time"] ?? "all");
$fromDate = trim((string) ($_GET["fromDate"] ?? ""));
$toDate = trim((string) ($_GET["toDate"] ?? ""));

$output = fopen("php://output", "w");
fputcsv($output, ["Koha", "Veprimi", "Entiteti", "Konteksti", "Aktori", "Roli", "Status", "Pershkrimi"]);

$result = $conn->query("
    SELECT
        audit.audit_id,
        audit.created_at,
        audit.action,
        audit.entity_type,
        audit.entity_id,
        audit.entity_label,
        audit.description,
        audit.status,
        audit.new_values,
        target_user.role AS target_user_role,
        COALESCE(audit.actor_role, actor_user.role, 'system') AS actor_role,
        CONCAT(actor_user.first_name, ' ', actor_user.last_name) AS actor_name
    FROM audit_log audit
    LEFT JOIN users actor_user ON actor_user.user_id = audit.actor_user_id
    LEFT JOIN users target_user
        ON target_user.user_id = audit.entity_id
        AND audit.entity_type IN ('users', 'auth')
    ORDER BY audit.created_at DESC
");

if ($result) {
    while ($row = $result->fetch_assoc()) {
        if ($search !== "" && strlen($search) >= 2 && strpos(export_row_search_text($row), strtolower($search)) === false) {
            continue;
        }

        if ($type !== "all" && export_audit_log_type($row) !== $type) {
            continue;
        }

        if ($actorRole !== "all" && strtolower((string) ($row["actor_role"] ?? "")) !== $actorRole) {
            continue;
        }

        if (!export_matches_time_filter($row["created_at"], $time, $fromDate, $toDate)) {
            continue;
        }

        fputcsv($output, [
            $row["created_at"],
            export_audit_action_label($row["action"]),
            export_audit_entity_label($row["entity_type"]),
            export_clean_text($row["entity_label"] ?? ""),
            trim($row["actor_name"] ?? "") ?: "System",
            $row["actor_role"],
            $row["status"],
            export_clean_text($row["description"] ?? "")
        ]);
    }
}

fclose($output);

?>
