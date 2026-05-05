<?php

function startSessionIfNeeded() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function createSession($user) {
    startSessionIfNeeded();

    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['role'] = $user['role'];
}

function logout($redirectTo = null) {
    startSessionIfNeeded();
    session_destroy();

    if ($redirectTo) {
        header("Location: " . $redirectTo);
        exit;
    }
}

function isLoggedIn() {
    startSessionIfNeeded();
    return isset($_SESSION['user_id']);
}

function isAdmin() {
    startSessionIfNeeded();
    return isset($_SESSION['user_id'], $_SESSION['role']) && $_SESSION['role'] === 'admin';
}

function requireAdminJson() {
    if (isAdmin()) {
        return;
    }

    http_response_code(403);
    header("Content-Type: application/json");
    echo json_encode([
        "success" => false,
        "message" => "Admin access required."
    ]);
    exit;
}

function requireRoleJson($role) {
    startSessionIfNeeded();

    if (isset($_SESSION['user_id'], $_SESSION['role']) && $_SESSION['role'] === $role) {
        return;
    }

    http_response_code(403);
    header("Content-Type: application/json");
    echo json_encode([
        "success" => false,
        "message" => ucfirst($role) . " access required."
    ]);
    exit;
}

if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    logout("/mechanic-system/public/staff-page.html");
}
?>
