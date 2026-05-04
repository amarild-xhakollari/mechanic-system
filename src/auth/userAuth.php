<?php

function verifyPassword($inputPassword, $hashedPassword) {
    return password_verify($inputPassword, $hashedPassword);
}

function validateClientLogin($user, $password) {
    if (!$user) return false;
    if (!verifyPassword($password, $user['password_hash'])) return false;
    if ($user['role'] !== 'client') return false;

    return true;
}

function validateStaffLogin($user, $password) {
    if (!$user) return false;
    if (!verifyPassword($password, $user['password_hash'])) return false;

    return true;
}

?>