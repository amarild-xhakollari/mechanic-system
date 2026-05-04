<?php

$mysqli=require __DIR__ . "/../src/config/db.php";

$phone = $_POST['phoneNumber'] ?? null;
$code = $_POST['code'] ?? null;

echo "Phone: " . $phone . "<br>";
echo "Code: " . $code . "<br>";

$query = "SELECT * FROM users WHERE phone_number = '$phone' AND password_hash = '$code'";

if( ! $stmt = $mysqli->prepare($query)) {
    die("Query failed: " . $mysqli->error);
}
echo "Query prepared successfully.<br>";

$result = $mysqli->query($query);

$user = $result->fetch_assoc();

if ($user) {
    echo "Login successful. User ID: " . $user['user_id'];
} else {
    echo "Invalid phone number or code.";
}
?>
