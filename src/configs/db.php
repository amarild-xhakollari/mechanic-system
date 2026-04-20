<?php

$serverName = "DESKTOP-1SVM4LD\SQLEXPRESS"; // or your server name
$database = "projektUni";
$username = "your_username"; // leave empty if using Windows Auth
$password = "your_password";

try {
    $conn = new PDO("sqlsrv:Server=$serverName;Database=$database;Trusted_Connection=yes");

    // Set error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Optional: set charset (important)
    $conn->exec("SET NAMES 'UTF-8'");

} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}