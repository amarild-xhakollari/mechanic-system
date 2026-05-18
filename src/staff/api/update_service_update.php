<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../auth/session.php";
requireRoleJson("staff");

$conn = require __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/service_update_helpers.php";
require_once __DIR__ . "/../../notifications/notification_service.php";

$staffId = (int) ($_SESSION["user_id"] ?? 0);
$updateId = (int) ($_POST["update_id"] ?? 0);
$note = trim($_POST["note"] ?? "");

if ($updateId <= 0) {
    staff_service_fail("Mungon sherbimi per modifikim.");
}

if ($note === "") {
    staff_service_fail("Shkruani informacionet mbi sherbimin.");
}

$existing = staff_get_service_update($conn, $updateId, $staffId);
if (!$existing) {
    staff_service_fail("Sherbimi nuk u gjet.", 404);
}

$hasImageColumn = staff_update_image_column_exists($conn);
$imagePath = $hasImageColumn ? staff_save_uploaded_image("image") : "";

if ($hasImageColumn) {
    if ($imagePath !== "") {
        $stmt = $conn->prepare("UPDATE job_updates SET note = ?, image_path = ? WHERE update_id = ?");
        if (!$stmt) staff_service_fail("Service update failed.");
        $stmt->bind_param("ssi", $note, $imagePath, $updateId);
    } else {
        $stmt = $conn->prepare("UPDATE job_updates SET note = ? WHERE update_id = ?");
        if (!$stmt) staff_service_fail("Service update failed.");
        $stmt->bind_param("si", $note, $updateId);
    }
} else {
    $stmt = $conn->prepare("UPDATE job_updates SET note = ? WHERE update_id = ?");
    if (!$stmt) staff_service_fail("Service update failed.");
    $stmt->bind_param("si", $note, $updateId);
}

$stmt->execute();
$service = staff_get_service_update($conn, $updateId, $staffId);

notify_client_job_event($conn, (int) $existing["job_id"], "service_updated", [
    "note" => $note,
    "image_path" => $imagePath
]);

echo json_encode([
    "success" => true,
    "message" => "Sherbimi u modifikua me sukses.",
    "service" => staff_format_service_update($service)
]);

?>
