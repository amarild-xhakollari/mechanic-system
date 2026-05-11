<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../auth/session.php";
requireRoleJson("staff");

$conn = require __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/service_update_helpers.php";

$staffId = (int) ($_SESSION["user_id"] ?? 0);
$updateId = (int) ($_GET["update_id"] ?? 0);
$jobId = (int) ($_GET["job_id"] ?? 0);

if ($updateId > 0) {
    $service = staff_get_service_update($conn, $updateId, $staffId);
} else {
    if ($jobId <= 0) {
        staff_service_fail("Mungon sherbimi.");
    }

    $selectImage = staff_update_image_column_exists($conn) ? "ju.image_path," : "NULL AS image_path,";
    $stmt = $conn->prepare("
        SELECT
            ju.update_id,
            ju.job_id,
            ju.old_status,
            ju.new_status,
            ju.note,
            $selectImage
            ju.updated_at
        FROM job_updates ju
        INNER JOIN jobs j ON j.job_id = ju.job_id
        WHERE ju.job_id = ?
          AND j.staff_id = ?
        ORDER BY ju.updated_at DESC
        LIMIT 1
    ");

    if (!$stmt) {
        staff_service_fail("Service query failed.");
    }

    $stmt->bind_param("ii", $jobId, $staffId);
    $stmt->execute();
    $service = $stmt->get_result()->fetch_assoc();
}

if (!$service) {
    staff_service_fail("Sherbimi nuk u gjet.");
}

echo json_encode([
    "success" => true,
    "service" => staff_format_service_update($service)
]);

?>
