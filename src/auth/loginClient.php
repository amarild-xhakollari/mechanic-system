<?php

$conn=require __DIR__ . "/../config/db.php";
require_once __DIR__ . "/userLogin.php";
require_once __DIR__ . "/userAuth.php";
require_once __DIR__ . "/session.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $phone = $_POST["phone_number"] ?? "";
    $password = $_POST["password"] ?? "";

    $user = findUserByPhone($conn, $phone);

    if (validateClientLogin($user, $password)) {
        createSession($user);
        header("Location: /mechanic-system/src/client/pages/client-active-jobs.html");
        exit;
    }

    header("Location: /mechanic-system/public/public-client.html?error=invalid_client_login");
    exit;
}

?>
