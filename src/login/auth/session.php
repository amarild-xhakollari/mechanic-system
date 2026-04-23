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

function logout() {
    startSessionIfNeeded();
    session_destroy();
}

function isLoggedIn() {
    startSessionIfNeeded();
    return isset($_SESSION['user_id']);
}
?>