<?php

$serverName = "localhost"; // or your server name
$database = "cars_db";
$username = "root"; // leave empty if using Windows Auth
$password = "password";

$conn = mysqli_connect($serverName, $username, $password, $database);

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

return $conn;
?>