<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../auth/session.php";
startSessionIfNeeded();

if (!isset($_SESSION["user_id"], $_SESSION["role"])) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Login required."
    ]);
    exit;
}

$conn = require __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../notification_service.php";

notifications_ensure_table($conn);

$userId = (int) $_SESSION["user_id"];
$role = $_SESSION["role"];
$method = $_SERVER["REQUEST_METHOD"] ?? "GET";
$action = $_GET["action"] ?? "list";

if ($method === "POST" && $action === "mark_read") {
    $data = json_decode(file_get_contents("php://input"), true) ?: [];
    $notificationId = (int) ($data["notification_id"] ?? 0);

    if ($notificationId > 0) {
        $stmt = $conn->prepare("
            UPDATE notifications
            SET status = 'read', read_at = NOW()
            WHERE notification_id = ?
              AND recipient_user_id = ?
              AND channel = 'in_app'
        ");
        if ($stmt) {
            $stmt->bind_param("ii", $notificationId, $userId);
            $stmt->execute();
        }
    }

    echo json_encode(["success" => true]);
    exit;
}

if ($method === "POST" && $action === "mark_all_read") {
    $stmt = $conn->prepare("
        UPDATE notifications
        SET status = 'read', read_at = NOW()
        WHERE recipient_user_id = ?
          AND channel = 'in_app'
          AND status <> 'read'
    ");
    if ($stmt) {
        $stmt->bind_param("i", $userId);
        $stmt->execute();
    }

    echo json_encode(["success" => true]);
    exit;
}

$notifications = [];
$stmt = $conn->prepare("
    SELECT notification_id, job_id, event_type, title, message, status, created_at, read_at
    FROM notifications
    WHERE recipient_user_id = ?
      AND recipient_role = ?
      AND channel = 'in_app'
    ORDER BY created_at DESC
    LIMIT 30
");

if ($stmt) {
    $stmt->bind_param("is", $userId, $role);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $notifications[] = [
            "id" => (int) $row["notification_id"],
            "job_id" => $row["job_id"] !== null ? (int) $row["job_id"] : null,
            "event_type" => $row["event_type"],
            "title" => $row["title"],
            "message" => $row["message"],
            "status" => $row["status"],
            "is_read" => $row["status"] === "read",
            "created_at" => $row["created_at"],
            "read_at" => $row["read_at"]
        ];
    }
}

$countStmt = $conn->prepare("
    SELECT COUNT(*) AS unread_count
    FROM notifications
    WHERE recipient_user_id = ?
      AND recipient_role = ?
      AND channel = 'in_app'
      AND status <> 'read'
");
$unreadCount = 0;

if ($countStmt) {
    $countStmt->bind_param("is", $userId, $role);
    $countStmt->execute();
    $countRow = $countStmt->get_result()->fetch_assoc();
    $unreadCount = (int) ($countRow["unread_count"] ?? 0);
}

echo json_encode([
    "success" => true,
    "unread_count" => $unreadCount,
    "notifications" => $notifications
]);

