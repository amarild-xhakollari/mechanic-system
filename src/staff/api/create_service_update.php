<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../auth/session.php";
requireRoleJson("staff");

$conn = require __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/service_update_helpers.php";
require_once __DIR__ . "/../../audit/audit_logger.php";

$staffId = (int) ($_SESSION["user_id"] ?? 0);
$jobId = (int) ($_POST["job_id"] ?? 0);
$note = trim($_POST["note"] ?? "");

if ($jobId <= 0) {
    staff_service_fail("Mungon puna per sherbimin.");
}

if ($note === "") {
    staff_service_fail("Shkruani informacionet mbi sherbimin.");
}

$job = staff_owns_job($conn, $jobId, $staffId);
if (!$job) {
    staff_service_fail("Kjo pune nuk eshte e caktuar per ju.", 403);
}

$oldStatus = $job["status"] ?: "in_progress";
$newStatus = "completed";
$hasImageColumn = staff_update_image_column_exists($conn);
$imagePath = $hasImageColumn ? staff_save_uploaded_image("image") : "";

if ($hasImageColumn) {
    $stmt = $conn->prepare("
        INSERT INTO job_updates (job_id, updated_by, old_status, new_status, note, image_path)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        staff_service_fail("Service insert failed.");
    }

    $stmt->bind_param("iissss", $jobId, $staffId, $oldStatus, $newStatus, $note, $imagePath);
} else {
    $stmt = $conn->prepare("
        INSERT INTO job_updates (job_id, updated_by, old_status, new_status, note)
        VALUES (?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        staff_service_fail("Service insert failed.");
    }

    $stmt->bind_param("iisss", $jobId, $staffId, $oldStatus, $newStatus, $note);
}

$stmt->execute();
$updateId = (int) $conn->insert_id;

$statusStmt = $conn->prepare("UPDATE jobs SET status = 'completed' WHERE job_id = ? AND staff_id = ?");
if ($statusStmt) {
    $statusStmt->bind_param("ii", $jobId, $staffId);
    $statusStmt->execute();
}

audit_log_event($conn, [
    "actor_user_id" => $staffId,
    "actor_role" => "staff",
    "action" => "UPDATE",
    "entity_type" => "jobs",
    "entity_id" => $jobId,
    "entity_label" => "Job",
    "description" => "Update Job - u shtua raport sherbimi",
    "old_values" => ["status" => $oldStatus],
    "new_values" => [
        "status" => $newStatus,
        "note" => $note,
        "image_path" => $imagePath
    ],
    "changed_fields" => ["status", "note", "image_path"]
]);

$service = staff_get_service_update($conn, $updateId, $staffId);

echo json_encode([
    "success" => true,
    "message" => "Sherbimi u regjistrua me sukses.",
    "service" => staff_format_service_update($service)
]);

?>
