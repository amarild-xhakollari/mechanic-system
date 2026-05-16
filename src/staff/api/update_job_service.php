<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../auth/session.php";
requireRoleJson("staff");

$conn = require __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/job_service_helpers.php";
require_once __DIR__ . "/../../audit/audit_logger.php";

job_services_ensure_table($conn);

$staffId = (int) ($_SESSION["user_id"] ?? 0);
$serviceId = (int) ($_POST["service_id"] ?? $_POST["id"] ?? 0);
$title = trim($_POST["title"] ?? "");
$description = trim($_POST["description"] ?? $_POST["note"] ?? "");

if ($serviceId <= 0) {
    job_service_fail("Mungon sherbimi per modifikim.");
}

if ($title === "") {
    job_service_fail("Shkruani titullin e sherbimit.");
}

if ($description === "") {
    job_service_fail("Shkruani pershkrimin e sherbimit.");
}

$existing = job_services_get_service($conn, $serviceId, $staffId);
if (!$existing) {
    job_service_fail("Sherbimi nuk u gjet.", 404);
}

$job = job_services_get_owned_job($conn, (int) $existing["job_id"], $staffId);
if (!$job) {
    job_service_fail("Kjo pune nuk eshte e caktuar per ju.", 403);
}

$imagePath = job_services_save_uploaded_image("image");

$conn->begin_transaction();

try {
    if ($imagePath !== "") {
        $stmt = $conn->prepare("
            UPDATE job_services
            SET title = ?, description = ?, image_path = ?
            WHERE service_id = ?
        ");
        if (!$stmt) {
            throw new RuntimeException("Service update failed.");
        }
        $stmt->bind_param("sssi", $title, $description, $imagePath, $serviceId);
    } else {
        $stmt = $conn->prepare("
            UPDATE job_services
            SET title = ?, description = ?
            WHERE service_id = ?
        ");
        if (!$stmt) {
            throw new RuntimeException("Service update failed.");
        }
        $stmt->bind_param("ssi", $title, $description, $serviceId);
    }

    $stmt->execute();

    audit_log_event($conn, [
        "actor_user_id" => $staffId,
        "actor_role" => "staff",
        "action" => "UPDATE",
        "entity_type" => "job_services",
        "entity_id" => $serviceId,
        "entity_label" => $title,
        "description" => "Update Sherbim - " . $title,
        "old_values" => [
            "title" => $existing["title"] ?? "",
            "description" => $existing["description"] ?? "",
            "image_path" => $existing["image_path"] ?? ""
        ],
        "new_values" => [
            "title" => $title,
            "description" => $description,
            "image_path" => $imagePath !== "" ? $imagePath : ($existing["image_path"] ?? "")
        ],
        "changed_fields" => ["title", "description", "image_path"]
    ]);

    $status = $job["status"] ?: "in_progress";
    job_services_log_update($conn, (int) $existing["job_id"], $staffId, $status, $status, "U modifikua sherbimi: " . $title . ".");

    $service = job_services_get_service($conn, $serviceId, $staffId);
    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Sherbimi u modifikua me sukses.",
        "service" => job_services_format($service)
    ]);
} catch (Throwable $error) {
    $conn->rollback();
    job_service_fail($error->getMessage(), 500);
}

?>
