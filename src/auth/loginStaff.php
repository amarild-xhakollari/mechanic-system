<?php

$conn=require __DIR__ . "/../config/db.php";
require_once __DIR__ . "/userLogin.php";
require_once __DIR__ . "/userAuth.php";
require_once __DIR__ . "/session.php";



if ($_SERVER["REQUEST_METHOD"] === "POST" || $_SERVER["REQUEST_METHOD"] === "GET") {

    $identifier = trim($_POST["identifier"] ?? $_GET["identifier"] ?? "");
    $password = $_POST["password"] ?? $_GET["password"] ?? "";

    $user = findStaffUserByLogin($conn, $identifier);

    if (validateStaffLogin($user, $password)) {
        createSession($user);

        header("Location: /mechanic-system/src/staff/pages/staff_dashboard.html");

        exit;
    }



    header("Location: /mechanic-system/public/staff-page.html?error=invalid_staff_login");
    exit;
}

?>
