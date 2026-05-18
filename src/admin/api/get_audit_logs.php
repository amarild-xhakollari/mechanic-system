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

function audit_log_type(array $log) {
    $action = strtolower((string) ($log["action"] ?? ""));
    $entity = strtolower((string) ($log["entity"] ?? ""));

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

    if ($entityType === "user" && !empty($log["targetRole"])) {
        $entityType = $log["targetRole"];
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

function audit_log_search_text(array $log) {
    return strtolower(implode(" ", [
        $log["id"] ?? "",
        $log["entity"] ?? "",
        $log["entityId"] ?? "",
        $log["action"] ?? "",
        $log["actor"] ?? "",
        $log["actorRole"] ?? "",
        $log["status"] ?? "",
        $log["contextLabel"] ?? "",
        $log["date"] ?? "",
        $log["summary"] ?? ""
    ]));
}

function audit_parse_input_date($value, $endOfDay = false) {
    if (!$value) {
        return null;
    }

    $date = DateTime::createFromFormat("Y-m-d H:i:s", $value . ($endOfDay ? " 23:59:59" : " 00:00:00"));
    return $date ?: null;
}

function audit_matches_time_filter($createdAt, $time, $fromDate, $toDate) {
    if ($time === "all" && $fromDate === "" && $toDate === "") {
        return true;
    }

    $logDate = DateTime::createFromFormat("Y-m-d H:i:s", (string) $createdAt);
    if (!$logDate) {
        return $time === "all";
    }

    $now = new DateTime();

    if ($time === "today") {
        return $logDate >= (clone $now)->setTime(0, 0, 0);
    }

    if ($time === "7days") {
        return $logDate >= (clone $now)->modify("-7 days");
    }

    if ($time === "30days") {
        return $logDate >= (clone $now)->modify("-30 days");
    }

    $from = audit_parse_input_date($fromDate);
    $to = audit_parse_input_date($toDate, true);

    if ($from && $logDate < $from) {
        return false;
    }

    if ($to && $logDate > $to) {
        return false;
    }

    return true;
}

if (!audit_logs_table_exists($mysqli)) {
    echo json_encode([
        "logs" => [],
        "availableTypes" => [],
        "pagination" => [
            "page" => 1,
            "perPage" => 25,
            "total" => 0,
            "totalPages" => 0,
            "hasMore" => false
        ]
    ]);
    exit;
}

$page = max(1, (int) ($_GET["page"] ?? 1));
$perPage = min(50, max(10, (int) ($_GET["perPage"] ?? 25)));
$search = trim((string) ($_GET["q"] ?? ""));
$type = (string) ($_GET["type"] ?? "all");
$actorRole = strtolower((string) ($_GET["actorRole"] ?? "all"));
$time = (string) ($_GET["time"] ?? "all");
$fromDate = trim((string) ($_GET["fromDate"] ?? ""));
$toDate = trim((string) ($_GET["toDate"] ?? ""));

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
";

$result = $mysqli->query($sql);
$allLogs = [];

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

        $log = [
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
        $log["type"] = audit_log_type($log);
        $allLogs[] = $log;
    }
}

$availableTypes = array_values(array_unique(array_map(function ($log) {
    return $log["type"];
}, $allLogs)));
sort($availableTypes);

$filteredLogs = array_values(array_filter($allLogs, function ($log) use ($search, $type, $actorRole, $time, $fromDate, $toDate) {
    if ($search !== "" && strlen($search) >= 2 && strpos(audit_log_search_text($log), strtolower($search)) === false) {
        return false;
    }

    if ($type !== "all" && $log["type"] !== $type) {
        return false;
    }

    if ($actorRole !== "all" && strtolower((string) ($log["actorRole"] ?? "")) !== $actorRole) {
        return false;
    }

    return audit_matches_time_filter($log["date"], $time, $fromDate, $toDate);
}));

$total = count($filteredLogs);
$totalPages = $total > 0 ? (int) ceil($total / $perPage) : 0;
$offset = ($page - 1) * $perPage;
$logs = array_slice($filteredLogs, $offset, $perPage);

echo json_encode([
    "logs" => $logs,
    "availableTypes" => $availableTypes,
    "pagination" => [
        "page" => $page,
        "perPage" => $perPage,
        "total" => $total,
        "totalPages" => $totalPages,
        "hasMore" => $page < $totalPages
    ]
]);

?>
