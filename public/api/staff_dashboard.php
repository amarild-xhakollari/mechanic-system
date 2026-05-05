<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../src/auth/session.php";
requireRoleJson("staff");

$conn = require __DIR__ . "/../../src/config/db.php";
$staff_id = (int) ($_SESSION["user_id"] ?? 0);

$user_sql = "
    SELECT user_id, first_name, last_name, email, phone_number, login_identifier
    FROM users
    WHERE user_id = ?
      AND role = 'staff'
    LIMIT 1
";

$user_stmt = $conn->prepare($user_sql);

if (!$user_stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Staff query failed."
    ]);
    exit;
}

$user_stmt->bind_param("i", $staff_id);
$user_stmt->execute();
$user = $user_stmt->get_result()->fetch_assoc();

if (!$user) {
    echo json_encode([
        "success" => false,
        "message" => "Staff not found."
    ]);
    exit;
}

$jobs = [];
$jobs_sql = "
    SELECT
        j.job_id,
        j.status,
        j.job_type,
        j.description,
        j.updated_at,
        v.plate_number,
        CONCAT(client_user.first_name, ' ', client_user.last_name) AS client_name
    FROM jobs j
    LEFT JOIN vehicles v ON v.vehicle_id = j.vehicle_id
    LEFT JOIN users client_user ON client_user.user_id = j.client_id
    WHERE j.staff_id = ?
    ORDER BY
        CASE WHEN j.status IN ('created', 'in_progress') THEN 0 ELSE 1 END,
        j.updated_at DESC
";

$jobs_stmt = $conn->prepare($jobs_sql);

if ($jobs_stmt) {
    $jobs_stmt->bind_param("i", $staff_id);
    $jobs_stmt->execute();
    $result = $jobs_stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $jobs[] = [
            "id" => (int) $row["job_id"],
            "plate" => $row["plate_number"],
            "client" => trim($row["client_name"] ?? ""),
            "status" => $row["status"],
            "type" => $row["job_type"],
            "description" => $row["description"],
            "updated_at" => $row["updated_at"]
        ];
    }
}

echo json_encode([
    "success" => true,
    "user" => [
        "id" => (int) $user["user_id"],
        "name" => trim(($user["first_name"] ?? "") . " " . ($user["last_name"] ?? "")),
        "email" => $user["email"],
        "phone" => $user["phone_number"],
        "code" => $user["login_identifier"] ?: "STAFF-" . $user["user_id"]
    ],
    "jobs" => $jobs
]);

?>
