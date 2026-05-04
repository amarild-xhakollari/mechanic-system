<?php

$conn=require __DIR__ . "/../config/db.php";
require_once "userLogin.php";
require_once "userAuth.php";
require_once "session.php";



if ($_SERVER["REQUEST_METHOD"] === "POST" || $_SERVER["REQUEST_METHOD"] === "GET") {

    $identifier = $_POST["identifier"] ?? $_GET["identifier"] ?? "";
    $password = $_POST["password"] ?? $_GET["password"] ?? "";

    $user = findUserByIdentifier($conn, $identifier);

    if (validateStaffLogin($user, $password)) {
        createSession($user);

        header("Location: /mechanic-system/src/admin/pages/admin-home.html");

        exit;
    }



    $error = "Invalid credentials";

    echo $error;
}

?>
