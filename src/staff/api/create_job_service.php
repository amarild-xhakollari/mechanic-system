<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../auth/session.php";
requireRoleJson("staff");

$conn = require __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/job_service_helpers.php";
require_once __DIR__ . "/../../audit/audit_logger.php";
require_once __DIR__ . "/../../notifications/notification_service.php";

job_services_ensure_table($conn);

$staffId = (int) ($_SESSION["user_id"] ?? 0);
$jobId = (int) ($_POST["job_id"] ?? 0);
$title = trim($_POST["title"] ?? "");
$description = trim($_POST["description"] ?? $_POST["note"] ?? "");

if ($jobId <= 0) {
    job_service_fail("Mungon puna per sherbimin.");
}

if ($title === "") {
    job_service_fail("Shkruani titullin e sherbimit.");
}

if ($description === "") {
    job_service_fail("Shkruani pershkrimin e sherbimit.");
}

$job = job_services_get_owned_job($conn, $jobId, $staffId);
if (!$job) {
    job_service_fail("Kjo pune nuk eshte e caktuar per ju.", 403);
}

$imagePath = job_services_save_uploaded_image("image");

$conn->begin_transaction();

try {
    $stmt = $conn->prepare("
        INSERT INTO job_services (job_id, created_by, title, description, image_path)
        VALUES (?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        throw new RuntimeException("Service insert failed.");
    }

    $stmt->bind_param("iisss", $jobId, $staffId, $title, $description, $imagePath);
    $stmt->execute();
    $serviceId = (int) $conn->insert_id;

    audit_log_event($conn, [
        "actor_user_id" => $staffId,
        "actor_role" => "staff",
        "action" => "INSERT",
        "entity_type" => "job_services",
        "entity_id" => $serviceId,
        "entity_label" => $title,
        "description" => "Create Sherbim - " . $title,
        "new_values" => [
            "job_id" => $jobId,
            "title" => $title,
            "description" => $description,
            "status" => "active"
        ],
        "changed_fields" => ["job_id", "title", "description", "status"]
    ]);

    $status = $job["status"] ?: "in_progress";
    job_services_log_update($conn, $jobId, $staffId, $status, $status, "U shtua sherbimi: " . $title . ".");

    $service = job_services_get_service($conn, $serviceId, $staffId);
    $conn->commit();

    notify_client_job_event($conn, $jobId, "service_added", [
        "title" => $title,
        "description" => $description
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Sherbimi u regjistrua me sukses.",
        "service" => job_services_format($service)
    ]);
} catch (Throwable $error) {
    $conn->rollback();
    job_service_fail($error->getMessage(), 500);
}

?>
