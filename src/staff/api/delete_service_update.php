<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../auth/session.php";
requireRoleJson("staff");

$conn = require __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/service_update_helpers.php";

$staffId = (int) ($_SESSION["user_id"] ?? 0);
$data = json_decode(file_get_contents("php://input"), true);
$updateId = (int) ($data["update_id"] ?? $_POST["update_id"] ?? 0);

if ($updateId <= 0) {
    staff_service_fail("Mungon sherbimi per fshirje.");
}

$existing = staff_get_service_update($conn, $updateId, $staffId);
if (!$existing) {
    staff_service_fail("Sherbimi nuk u gjet.", 404);
}

$stmt = $conn->prepare("
    DELETE ju
    FROM job_updates ju
    INNER JOIN jobs j ON j.job_id = ju.job_id
    WHERE ju.update_id = ?
      AND j.staff_id = ?
");

if (!$stmt) {
    staff_service_fail("Service delete failed.");
}

$stmt->bind_param("ii", $updateId, $staffId);
$stmt->execute();

echo json_encode([
    "success" => true,
    "message" => "Sherbimi u fshi me sukses.",
    "job_id" => (int) $existing["job_id"]
]);

?>
