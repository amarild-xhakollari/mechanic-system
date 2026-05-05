<?php

require_once __DIR__ . "/../../auth/session.php";
requireAdminJson();

$conn = require __DIR__ . "/../../config/db.php";

header("Content-Type: application/json");

$q = trim($_GET["q"] ?? "");

if (strlen($q) < 2) {
    echo json_encode([]);
    exit;
}

$search = "%" . $q . "%";

$sql = "
    SELECT user_id, first_name, last_name, phone_number, email, login_identifier
    FROM users
    WHERE role = 'staff'
      AND (
        first_name LIKE ?
        OR last_name LIKE ?
        OR CONCAT(first_name, ' ', last_name) LIKE ?
        OR login_identifier LIKE ?
        OR phone_number LIKE ?
      )
    ORDER BY first_name, last_name
    LIMIT 12
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([]);
    exit;
}

$stmt->bind_param("sssss", $search, $search, $search, $search, $search);
$stmt->execute();
$result = $stmt->get_result();

$staff = [];

while ($row = $result->fetch_assoc()) {
    $staff[] = [
        "id" => (int) $row["user_id"],
        "name" => trim(($row["first_name"] ?? "") . " " . ($row["last_name"] ?? "")),
        "phone" => $row["phone_number"],
        "email" => $row["email"],
        "code" => $row["login_identifier"] ?: "STAFF-" . $row["user_id"]
    ];
}

echo json_encode($staff);

?>
