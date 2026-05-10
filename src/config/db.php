<?php

$serverName = "localhost"; // or your server name
$database = "workshop";
$username = "root"; // leave empty if using Windows Auth
$password = "12345";

$conn = mysqli_connect($serverName, $username, $password, $database);

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

mysqli_set_charset($conn, "utf8mb4");

$mysqli = $conn;

return $conn;
?>
