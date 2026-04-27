<?php

require_once "db1.php";

header("Content-Type: application/json");

$q = trim($_GET["q"] ?? "");

if (strlen($q) < 2) {
    echo json_encode([]);
    exit;
}

$search = "%" . $q . "%";

$sql = "
    SELECT 
        user_id,
        first_name,
        last_name,
        phone_number,
        email
    FROM users
    WHERE role = 'client'
      AND (
        first_name LIKE ?
        OR last_name LIKE ?
        OR phone_number LIKE ?
        OR CONCAT(first_name, ' ', last_name) LIKE ?
      )
    LIMIT 10
";

$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    echo json_encode([]);
    exit;
}

$stmt->bind_param("ssss", $search, $search, $search, $search);
$stmt->execute();

$result = $stmt->get_result();

$users = [];

while ($row = $result->fetch_assoc()) {
    $users[] = $row;
}

echo json_encode($users);

?>