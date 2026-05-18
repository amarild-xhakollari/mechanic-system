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
$data = json_decode(file_get_contents("php://input"), true);
$serviceId = (int) ($data["service_id"] ?? $data["id"] ?? $_POST["service_id"] ?? $_POST["id"] ?? 0);

if ($serviceId <= 0) {
    job_service_fail("Mungon sherbimi per fshirje.");
}

$existing = job_services_get_service($conn, $serviceId, $staffId);
if (!$existing) {
    job_service_fail("Sherbimi nuk u gjet.", 404);
}

$job = job_services_get_owned_job($conn, (int) $existing["job_id"], $staffId);
if (!$job) {
    job_service_fail("Kjo pune nuk eshte e caktuar per ju.", 403);
}

$conn->begin_transaction();

try {
    $stmt = $conn->prepare("
        UPDATE job_services
        SET status = 'deleted', deleted_at = NOW()
        WHERE service_id = ?
    ");

    if (!$stmt) {
        throw new RuntimeException("Service delete failed.");
    }

    $stmt->bind_param("i", $serviceId);
    $stmt->execute();

    audit_log_event($conn, [
        "actor_user_id" => $staffId,
        "actor_role" => "staff",
        "action" => "DELETE",
        "entity_type" => "job_services",
        "entity_id" => $serviceId,
        "entity_label" => $existing["title"] ?? "Sherbim",
        "description" => "Delete Sherbim - " . ($existing["title"] ?? "Sherbim"),
        "old_values" => [
            "job_id" => (int) $existing["job_id"],
            "title" => $existing["title"] ?? "",
            "description" => $existing["description"] ?? "",
            "status" => $existing["status"] ?? ""
        ],
        "new_values" => ["status" => "deleted"],
        "changed_fields" => ["status", "deleted_at"]
    ]);

    $status = $job["status"] ?: "in_progress";
    job_services_log_update($conn, (int) $existing["job_id"], $staffId, $status, $status, "U fshi sherbimi: " . $existing["title"] . ".");

    $conn->commit();

    notify_client_job_event($conn, (int) $existing["job_id"], "service_deleted", [
        "title" => $existing["title"] ?? "Sherbim"
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Sherbimi u fshi me sukses.",
        "job_id" => (int) $existing["job_id"]
    ]);
} catch (Throwable $error) {
    $conn->rollback();
    job_service_fail($error->getMessage(), 500);
}

?>
