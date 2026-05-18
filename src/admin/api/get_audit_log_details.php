<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../auth/session.php";
requireAdminJson();

$conn = require __DIR__ . "/../../config/db.php";

$audit_id = (int) ($_GET["audit_id"] ?? 0);

if ($audit_id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid audit log id."
    ]);
    exit;
}

$table_result = $conn->query("SHOW TABLES LIKE 'audit_log'");

if (!$table_result || $table_result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Audit log table not found."
    ]);
    exit;
}

$sql = "
    SELECT
        audit.audit_id,
        audit.actor_user_id,
        COALESCE(audit.actor_role, actor_user.role, 'system') AS actor_role,
        audit.action,
        audit.entity_type,
        audit.entity_id,
        audit.entity_label,
        audit.description,
        audit.old_values,
        audit.new_values,
        audit.changed_fields,
        audit.request_method,
        audit.request_path,
        audit.ip_address,
        audit.user_agent,
        audit.session_id_hash,
        audit.status,
        audit.error_message,
        audit.created_at,
        CONCAT(actor_user.first_name, ' ', actor_user.last_name) AS actor_name,
        actor_user.email AS actor_email,
        actor_user.phone_number AS actor_phone,
        actor_user.role AS actor_user_role,
        CONCAT(target_user.first_name, ' ', target_user.last_name) AS target_user_name,
        target_user.role AS target_user_role,
        target_user.email AS target_user_email,
        target_user.phone_number AS target_user_phone,
        job.job_id AS job_id,
        job.description AS job_description,
        job.job_type AS job_type,
        job.status AS job_status,
        job.updated_at AS job_updated_at,
        job_vehicle.plate_number AS job_plate_number,
        CONCAT(job_client.first_name, ' ', job_client.last_name) AS job_client_name,
        job.client_id AS job_client_id,
        job.staff_id AS job_staff_id,
        CONCAT(job_staff.first_name, ' ', job_staff.last_name) AS job_staff_name,
        service.service_id AS service_id,
        service.title AS service_title,
        service.description AS service_description,
        service.job_id AS service_job_id,
        service_job_vehicle.plate_number AS service_job_plate_number,
        service_job.status AS service_job_status,
        service_job.updated_at AS service_job_updated_at,
        CONCAT(service_job_client.first_name, ' ', service_job_client.last_name) AS service_job_client_name,
        CONCAT(service_job_staff.first_name, ' ', service_job_staff.last_name) AS service_job_staff_name,
        vehicle.vehicle_id AS vehicle_id,
        vehicle.plate_number AS vehicle_plate_number,
        vehicle.vin AS vehicle_vin,
        vehicle.client_id AS vehicle_client_id,
        CONCAT(vehicle_client.first_name, ' ', vehicle_client.last_name) AS vehicle_client_name
    FROM audit_log audit
    LEFT JOIN users actor_user ON actor_user.user_id = audit.actor_user_id
    LEFT JOIN users target_user
        ON target_user.user_id = audit.entity_id
        AND audit.entity_type IN ('users', 'auth')
    LEFT JOIN jobs job
        ON job.job_id = audit.entity_id
        AND audit.entity_type = 'jobs'
    LEFT JOIN vehicles job_vehicle ON job_vehicle.vehicle_id = job.vehicle_id
    LEFT JOIN users job_client ON job_client.user_id = job.client_id
    LEFT JOIN users job_staff ON job_staff.user_id = job.staff_id
    LEFT JOIN job_services service
        ON service.service_id = audit.entity_id
        AND audit.entity_type = 'job_services'
    LEFT JOIN jobs service_job ON service_job.job_id = service.job_id
    LEFT JOIN vehicles service_job_vehicle ON service_job_vehicle.vehicle_id = service_job.vehicle_id
    LEFT JOIN users service_job_client ON service_job_client.user_id = service_job.client_id
    LEFT JOIN users service_job_staff ON service_job_staff.user_id = service_job.staff_id
    LEFT JOIN vehicles vehicle
        ON vehicle.vehicle_id = audit.entity_id
        AND audit.entity_type = 'vehicles'
    LEFT JOIN users vehicle_client ON vehicle_client.user_id = vehicle.client_id
    WHERE audit.audit_id = ?
    LIMIT 1
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Audit log query failed."
    ]);
    exit;
}

$stmt->bind_param("i", $audit_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if (!$row) {
    echo json_encode([
        "success" => false,
        "message" => "Audit log not found."
    ]);
    exit;
}

function decode_audit_json($value) {
    if ($value === null || $value === "") {
        return null;
    }

    $decoded = json_decode($value, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        return $value;
    }

    return $decoded;
}

function clean_display_text($value) {
    return trim(preg_replace("/\\s*#\\d+\\b/", "", (string) ($value ?? "")));
}

function has_raw_audit_words($value) {
    return preg_match("/\\b(users|jobs|job_services|vehicles|INSERT|UPDATE|DELETE|LOGIN)\\b/i", (string) $value) === 1;
}

function display_action($action) {
    $normalized = strtolower($action ?? "");

    return [
        "insert" => "Create",
        "update" => "Update",
        "delete" => "Delete",
        "login" => "Login"
    ][$normalized] ?? ucfirst($normalized ?: "Log");
}

function display_entity_type($entityType, $role = null) {
    if ($entityType === "users") {
        if ($role === "client") {
            return "Klient";
        }

        if ($role === "staff") {
            return "Staf";
        }

        if ($role === "admin") {
            return "Admin";
        }

        return "Perdorues";
    }

    return [
        "auth" => "Hyrje ne sistem",
        "jobs" => "Pune",
        "job" => "Pune",
        "job_services" => "Sherbim",
        "service" => "Sherbim",
        "vehicles" => "Makine",
        "vehicle" => "Makine",
        "client" => "Klient",
        "staff" => "Staf",
        "admin" => "Admin",
        "actor" => "Aktori",
        "user" => "Perdorues",
        "system" => "Sistem"
    ][$entityType] ?? ucfirst(str_replace("_", " ", $entityType ?: "Log"));
}

function add_related_entity(&$entities, $type, $title, $subtitle, $href = null, $meta = null, $data = []) {
    if (!$title) {
        return;
    }

    $key = $type . "|" . $title . "|" . ($href ?? "");

    if (isset($entities[$key])) {
        return;
    }

    $entities[$key] = [
        "type" => $type,
        "label" => display_entity_type($type),
        "title" => $title,
        "subtitle" => $subtitle,
        "href" => $href,
        "meta" => $meta,
        "data" => $data
    ];
}

function user_href($userId, $role) {
    if (!$userId) {
        return null;
    }

    if ($role === "client") {
        return "client-details.html?client_id=" . urlencode((string) $userId);
    }

    if ($role === "staff") {
        return "staff-details.html?staff_id=" . urlencode((string) $userId);
    }

    return null;
}

$actor_name = trim($row["actor_name"] ?? "");
$entity_id = $row["entity_id"] ?? null;
$entity_type = $row["entity_type"] ?? "system";
$old_values = decode_audit_json($row["old_values"]);
$new_values = decode_audit_json($row["new_values"]);
$changed_fields = decode_audit_json($row["changed_fields"]);
$related_entities = [];
$actor_role = $row["actor_role"] ?: ($row["actor_user_role"] ?: "system");
$target_role_for_display = $row["target_user_role"] ?: (is_array($new_values) ? ($new_values["role"] ?? null) : null);
$entity_display_type = display_entity_type($entity_type, $target_role_for_display);
$entity_display_label = clean_display_text($row["entity_label"]) ?: $entity_display_type;

if ($entity_type === "auth") {
    $entity_display_label = "Hyrje ne sistem";
}

if (in_array($actor_role, ["staff", "client"], true)) {
    add_related_entity(
        $related_entities,
        $actor_role,
        $actor_name !== "" ? $actor_name : "System",
        display_entity_type("users", $actor_role) . " qe beri veprimin",
        user_href($row["actor_user_id"], $actor_role),
        $row["actor_email"] ?: $row["actor_phone"],
        [
            "id" => $row["actor_user_id"],
            "name" => $actor_name,
            "phone" => $row["actor_phone"],
            "email" => $row["actor_email"],
            "tags" => [$actor_role]
        ]
    );
}

if ($entity_type === "users") {
    $target_name = trim($row["target_user_name"] ?? "");
    $target_role = $target_role_for_display ?: "";
    $target_type = $target_role ?: "user";
    $entity_display_label = $target_name !== "" ? $target_name : display_entity_type("users", $target_role);

    add_related_entity(
        $related_entities,
        $target_type,
        $entity_display_label,
        display_entity_type("users", $target_role) . " i lidhur me logun",
        user_href($entity_id, $target_role),
        $row["target_user_email"] ?: $row["target_user_phone"],
        [
            "id" => $entity_id,
            "name" => $entity_display_label,
            "phone" => $row["target_user_phone"],
            "email" => $row["target_user_email"],
            "tags" => [$target_role]
        ]
    );
}

if ($entity_type === "jobs") {
    $plate = $row["job_plate_number"] ?: "pa targe";
    $entity_display_label = "Job: " . $plate;

    add_related_entity(
        $related_entities,
        "job",
        $entity_display_label,
        $row["job_description"] ?: display_action($row["action"]) . " pune",
        $row["job_id"] ? "job-details.html?job_id=" . urlencode((string) $row["job_id"]) : null,
        $row["job_status"],
        [
            "id" => $row["job_id"],
            "plate_number" => $plate,
            "client_name" => trim($row["job_client_name"] ?? ""),
            "mechanics" => array_values(array_filter([trim($row["job_staff_name"] ?? "")])),
            "status" => $row["job_status"],
            "updated_at" => $row["job_updated_at"]
        ]
    );

    add_related_entity(
        $related_entities,
        "client",
        trim($row["job_client_name"] ?? ""),
        "Klienti i job-it",
        user_href($row["job_client_id"], "client"),
        null,
        [
            "id" => $row["job_client_id"],
            "name" => trim($row["job_client_name"] ?? "")
        ]
    );

    add_related_entity(
        $related_entities,
        "staff",
        trim($row["job_staff_name"] ?? ""),
        "Stafi i caktuar",
        user_href($row["job_staff_id"], "staff"),
        null,
        [
            "id" => $row["job_staff_id"],
            "name" => trim($row["job_staff_name"] ?? ""),
            "tags" => ["staff"]
        ]
    );
}

if ($entity_type === "job_services") {
    $service_job_id = $row["service_job_id"] ?: (is_array($new_values) ? ($new_values["job_id"] ?? null) : null);
    $service_title = $row["service_title"] ?: (is_array($new_values) ? ($new_values["title"] ?? "") : "");
    $plate = $row["service_job_plate_number"] ?: "pa targe";
    $entity_display_label = $service_title ?: "Sherbim";

    add_related_entity(
        $related_entities,
        "service",
        $entity_display_label,
        $row["service_description"] ?: "Sherbim i lidhur me job-in",
        null,
        "Job: " . $plate,
        [
            "id" => $row["service_id"],
            "title" => $entity_display_label,
            "description" => $row["service_description"] ?: "Sherbim i lidhur me job-in"
        ]
    );

    add_related_entity(
        $related_entities,
        "job",
        "Job: " . $plate,
        "Puna ku u krijua sherbimi",
        $service_job_id ? "job-details.html?job_id=" . urlencode((string) $service_job_id) : null,
        $row["service_job_status"],
        [
            "id" => $service_job_id,
            "plate_number" => $plate,
            "client_name" => trim($row["service_job_client_name"] ?? ""),
            "mechanics" => array_values(array_filter([trim($row["service_job_staff_name"] ?? "")])),
            "status" => $row["service_job_status"],
            "updated_at" => $row["service_job_updated_at"]
        ]
    );
}

if ($entity_type === "vehicles") {
    $entity_display_label = $row["vehicle_plate_number"] ? "Makina: " . $row["vehicle_plate_number"] : "Makina";

    add_related_entity(
        $related_entities,
        "client",
        trim($row["vehicle_client_name"] ?? ""),
        "Pronari i makines",
        user_href($row["vehicle_client_id"], "client"),
        null,
        [
            "id" => $row["vehicle_client_id"],
            "name" => trim($row["vehicle_client_name"] ?? "")
        ]
    );
}

$display_description = clean_display_text($row["description"]);
if ($display_description === "" || has_raw_audit_words($display_description)) {
    $display_description = display_action($row["action"]) . " " . $entity_display_type;

    if ($entity_display_label && $entity_display_label !== $entity_display_type) {
        $display_description .= " - " . $entity_display_label;
    }
}

echo json_encode([
    "success" => true,
    "log" => [
        "id" => (int) $row["audit_id"],
        "action" => $row["action"] ?? "LOG",
        "entity" => [
            "type" => $entity_type,
            "display_type" => $entity_display_type,
            "id" => $entity_id !== null ? (int) $entity_id : null,
            "label" => $entity_display_label
        ],
        "actor" => [
            "id" => $row["actor_user_id"] !== null ? (int) $row["actor_user_id"] : null,
            "name" => $actor_name !== "" ? $actor_name : "System",
            "role" => $actor_role,
            "email" => $row["actor_email"],
            "phone" => $row["actor_phone"]
        ],
        "description" => $display_description,
        "old_values" => $old_values,
        "new_values" => $new_values,
        "changed_fields" => $changed_fields,
        "related_entities" => array_values($related_entities),
        "request" => [
            "method" => $row["request_method"],
            "path" => $row["request_path"],
            "ip_address" => $row["ip_address"],
            "user_agent" => $row["user_agent"],
            "session_id_hash" => $row["session_id_hash"]
        ],
        "status" => $row["status"] ?: "success",
        "error_message" => $row["error_message"],
        "created_at" => $row["created_at"]
    ]
]);

?>
