<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../auth/session.php";
requireRoleJson("staff");

$conn = require __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/job_service_helpers.php";

job_services_ensure_table($conn);

$staffId = (int) ($_SESSION["user_id"] ?? 0);
$jobId = (int) ($_GET["job_id"] ?? 0);

if ($jobId <= 0) {
    job_service_fail("Mungon puna per sherbimet.");
}

$job = job_services_get_owned_job($conn, $jobId, $staffId);
if (!$job) {
    job_service_fail("Kjo pune nuk eshte e caktuar per ju.", 403);
}

$stmt = $conn->prepare("
    SELECT *
    FROM job_services
    WHERE job_id = ?
      AND status <> 'deleted'
    ORDER BY created_at DESC, service_id DESC
");

if (!$stmt) {
    job_service_fail("Service query failed.");
}

$stmt->bind_param("i", $jobId);
$stmt->execute();

$services = [];
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $services[] = job_services_format($row);
}

echo json_encode([
    "success" => true,
    "services" => $services
]);

?>
