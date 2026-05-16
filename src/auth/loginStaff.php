<?php

$conn=require __DIR__ . "/../config/db.php";
require_once __DIR__ . "/userLogin.php";
require_once __DIR__ . "/userAuth.php";
require_once __DIR__ . "/session.php";
require_once __DIR__ . "/../audit/audit_logger.php";



if ($_SERVER["REQUEST_METHOD"] === "POST" || $_SERVER["REQUEST_METHOD"] === "GET") {

    $identifier = trim($_POST["identifier"] ?? $_GET["identifier"] ?? "");
    $password = $_POST["password"] ?? $_GET["password"] ?? "";

    $user = findStaffUserByLogin($conn, $identifier);

    if (validateStaffLogin($user, $password)) {
        createSession($user);
        audit_log_event($conn, [
            "actor_user_id" => (int) $user["user_id"],
            "actor_role" => $user["role"],
            "action" => "LOGIN",
            "entity_type" => "auth",
            "entity_id" => (int) $user["user_id"],
            "entity_label" => "Login ne sistem",
            "description" => "Login ne sistem",
            "new_values" => ["role" => $user["role"]]
        ]);

        if ($user["role"] === "admin") {
            header("Location: /mechanic-system/src/admin/pages/admin-home.html");
        } else {
            header("Location: /mechanic-system/src/staff/pages/staff_dashboard.html");
        }

        exit;
    }

    audit_log_event($conn, [
        "actor_user_id" => null,
        "actor_role" => "unknown",
        "action" => "LOGIN",
        "entity_type" => "auth",
        "entity_id" => null,
        "entity_label" => "Tentative login",
        "description" => "Tentative login e pasuksesshme",
        "new_values" => ["identifier" => $identifier],
        "status" => "failed",
        "error_message" => "Invalid staff/admin credentials"
    ]);

    header("Location: /mechanic-system/public/staff-page.html?error=invalid_staff_login");
    exit;
}

?>
