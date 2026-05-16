<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../auth/session.php";
requireRoleJson("staff");

$conn = require __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/service_update_helpers.php";
require_once __DIR__ . "/../../audit/audit_logger.php";

$staffId = (int) ($_SESSION["user_id"] ?? 0);
$data = json_decode(file_get_contents("php://input"), true);
$jobId = (int) ($data["job_id"] ?? $_POST["job_id"] ?? 0);

if ($jobId <= 0) {
    staff_service_fail("Mungon puna qe do te perfundohet.");
}

$job = staff_owns_job($conn, $jobId, $staffId);
if (!$job) {
    staff_service_fail("Kjo pune nuk eshte e caktuar per ju.", 403);
}

if (($job["status"] ?? "") === "completed") {
    echo json_encode([
        "success" => true,
        "message" => "Puna eshte perfunduar me pare."
    ]);
    exit;
}

$oldStatus = $job["status"] ?: "in_progress";
$note = "Puna u perfundua nga stafi.";

$conn->begin_transaction();

try {
    $updateStmt = $conn->prepare("
        INSERT INTO job_updates (job_id, updated_by, old_status, new_status, note)
        VALUES (?, ?, ?, 'completed', ?)
    ");

    if (!$updateStmt) {
        throw new RuntimeException("Update insert failed.");
    }

    $updateStmt->bind_param("iiss", $jobId, $staffId, $oldStatus, $note);
    $updateStmt->execute();

    $statusStmt = $conn->prepare("
        UPDATE jobs
        SET status = 'completed'
        WHERE job_id = ?
          AND staff_id = ?
    ");

    if (!$statusStmt) {
        throw new RuntimeException("Status update failed.");
    }

    $statusStmt->bind_param("ii", $jobId, $staffId);
    $statusStmt->execute();

    audit_log_event($conn, [
        "actor_user_id" => $staffId,
        "actor_role" => "staff",
        "action" => "UPDATE",
        "entity_type" => "jobs",
        "entity_id" => $jobId,
        "entity_label" => "Job",
        "description" => "Update Job - puna u perfundua",
        "old_values" => ["status" => $oldStatus],
        "new_values" => ["status" => "completed"],
        "changed_fields" => ["status"]
    ]);

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Puna u perfundua me sukses."
    ]);
} catch (Throwable $error) {
    $conn->rollback();
    staff_service_fail($error->getMessage(), 500);
}

?>
