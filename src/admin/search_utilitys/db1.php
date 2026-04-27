<?php

$host = "localhost";
$user = "root";
$password = "password";
$dbname = "cars_db"; // vendos emrin e DB tende

$mysqli = new mysqli($host, $user, $password, $dbname);

if ($mysqli->connect_error) {
    die("Database connection failed: " . $mysqli->connect_error);
}

$mysqli->set_charset("utf8mb4");
?>