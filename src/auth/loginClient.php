<?php

$conn=require __DIR__ . "/../config/db.php";
require_once __DIR__ . "/userLogin.php";
require_once __DIR__ . "/userAuth.php";
require_once __DIR__ . "/session.php";
require_once __DIR__ . "/../audit/audit_logger.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $phone = $_POST["phone_number"] ?? "";
    $password = $_POST["password"] ?? "";

    $user = findUserByPhone($conn, $phone);

    if (validateClientLogin($user, $password)) {
        createSession($user);
        audit_log_event($conn, [
            "actor_user_id" => (int) $user["user_id"],
            "actor_role" => "client",
            "action" => "LOGIN",
            "entity_type" => "auth",
            "entity_id" => (int) $user["user_id"],
            "entity_label" => "Login ne sistem",
            "description" => "Login ne sistem",
            "new_values" => ["role" => "client"]
        ]);
        header("Location: /mechanic-system/src/client/pages/client-active-jobs.html");
        exit;
    }

    audit_log_event($conn, [
        "actor_user_id" => null,
        "actor_role" => "client",
        "action" => "LOGIN",
        "entity_type" => "auth",
        "entity_id" => null,
        "entity_label" => "Tentative login",
        "description" => "Tentative login e pasuksesshme",
        "new_values" => ["phone_number" => $phone],
        "status" => "failed",
        "error_message" => "Invalid client credentials"
    ]);

    header("Location: /mechanic-system/public/public-client.html?error=invalid_client_login");
    exit;
}

?>
