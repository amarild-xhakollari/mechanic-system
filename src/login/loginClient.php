<?php

$conn=require __DIR__ . "/../configs/db.php";
require_once "auth/userLogin.php";
require_once "auth/userAuth.php";
require_once "auth/session.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $phone = $_POST["phone_number"] ?? "";
    $password = $_POST["password"] ?? "";

    $user = findUserByPhone($conn, $phone);

    if (validateClientLogin($user, $password)) {
        createSession($user);
        header("Location: /mechanic-system/public/dashboard.html");
        exit;
    }

    $error = "Invalid credentials";

    echo $error;
}

?>