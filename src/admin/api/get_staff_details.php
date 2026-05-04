<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../auth/session.php";
requireAdminJson();

$conn = require __DIR__ . "/../../config/db.php";

$staff_id = (int) ($_GET["staff_id"] ?? 0);

if ($staff_id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid staff id."
    ]);
    exit;
}

$sql = "
    SELECT
        u.user_id,
        u.first_name,
        u.last_name,
        u.phone_number,
        u.email,
        u.login_identifier,
        u.role,
        COUNT(j_all.job_id) AS total_jobs,
        SUM(CASE WHEN j_all.status IN ('created', 'in_progress') THEN 1 ELSE 0 END) AS active_jobs
    FROM users u
    LEFT JOIN jobs j_all ON j_all.staff_id = u.user_id
    WHERE u.user_id = ?
      AND u.role = 'staff'
    GROUP BY
        u.user_id,
        u.first_name,
        u.last_name,
        u.phone_number,
        u.email,
        u.login_identifier,
        u.role
    LIMIT 1
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Staff query failed."
    ]);
    exit;
}

$stmt->bind_param("i", $staff_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if (!$row) {
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
        j.updated_at,
        v.plate_number,
        CONCAT(client_user.first_name, ' ', client_user.last_name) AS client_name
    FROM jobs j
    LEFT JOIN vehicles v ON v.vehicle_id = j.vehicle_id
    LEFT JOIN users client_user ON client_user.user_id = j.client_id
    WHERE j.staff_id = ?
      AND j.status IN ('created', 'in_progress')
    ORDER BY j.updated_at DESC
";

$jobs_stmt = $conn->prepare($jobs_sql);

if ($jobs_stmt) {
    $jobs_stmt->bind_param("i", $staff_id);
    $jobs_stmt->execute();
    $jobs_result = $jobs_stmt->get_result();

    while ($job = $jobs_result->fetch_assoc()) {
        $status_label = in_array($job["status"], ["created", "in_progress"], true) ? "Aktiv" : $job["status"];

        $jobs[] = [
            "id" => (int) $job["job_id"],
            "code" => $job["plate_number"],
            "client" => trim($job["client_name"] ?? ""),
            "date" => $job["updated_at"],
            "status" => $job["status"],
            "status_label" => $status_label
        ];
    }
}

$role_label = $row["role"] === "staff" ? "Mekanik" : $row["role"];

echo json_encode([
    "success" => true,
    "staff" => [
        "id" => (int) $row["user_id"],
        "name" => trim(($row["first_name"] ?? "") . " " . ($row["last_name"] ?? "")),
        "code" => $row["login_identifier"] ?: "STAFF-" . $row["user_id"],
        "email" => $row["email"],
        "phone" => $row["phone_number"],
        "roles" => [$role_label],
        "active_jobs" => (int) ($row["active_jobs"] ?? 0),
        "total_jobs" => (int) ($row["total_jobs"] ?? 0),
        "active_jobs_list" => $jobs
    ]
]);

?>
