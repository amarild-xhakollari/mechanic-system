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

if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    logout("/mechanic-system/public/staff-page.html");
}
?>
