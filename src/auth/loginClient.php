<?php

$conn=require __DIR__ . "/../config/db.php";
require_once "userLogin.php";
require_once "userAuth.php";
require_once "session.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $phone = $_POST["phone_number"] ?? "";
    $password = $_POST["password"] ?? "";

    $user = findUserByPhone($conn, $phone);

    if (validateClientLogin($user, $password)) {
        createSession($user);
        header("Location: /mechanic-system/public/dashboard.html");
        exit;
    }

    header("Location: /mechanic-system/public/public-client.html?error=invalid_client_login");
    exit;
}

?>
