<?php

$conn=require __DIR__ . "/../configs/db.php";
require_once "auth/userLogin.php";
require_once "auth/userAuth.php";
require_once "auth/session.php";



if ($_SERVER["REQUEST_METHOD"] === "POST" || $_SERVER["REQUEST_METHOD"] === "GET") {

    $identifier = $_POST["identifier"] ?? $_GET["identifier"] ?? "";
    $password = $_POST["password"] ?? $_GET["password"] ?? "";

    $user = findUserByIdentifier($conn, $identifier);

    if (validateStaffLogin($user, $password)) {
        createSession($user);

        // route based on role
        if ($user['role'] === 'admin') {
            header("Location: /mechanic-system/public/admin/dashboard.html");
        } else {
            header("Location: /mechanic-system/public/dashboard.html");
        }

        exit;
    }



    $error = "Invalid credentials";

    echo $error;
}

?>