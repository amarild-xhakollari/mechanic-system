<?php

function getClientCreatePayload() {
    return [
        'first_name' => trim($_POST['firstName'] ?? ''),
        'last_name' => trim($_POST['lastName'] ?? ''),
        'phone_number' => trim($_POST['phone'] ?? ''),
        'email' => trim($_POST['email'] ?? ''),
        'login_identifier' => null,
        'role' => 'client',
        'password_hash' => password_hash($_POST['password'] ?? '', PASSWORD_DEFAULT),
    ];
}

function getStaffCreatePayload() {
    $loginIdentifier = $_POST['login_identifer'] ?? $_POST['login_identifier'] ?? '';

    return [
        'first_name' => trim($_POST['firstName'] ?? ''),
        'last_name' => trim($_POST['lastName'] ?? ''),
        'phone_number' => trim($_POST['phone'] ?? ''),
        'email' => trim($_POST['email'] ?? ''),
        'login_identifier' => trim($loginIdentifier),
        'role' => 'staff',
        'password_hash' => password_hash($_POST['password'] ?? '', PASSWORD_DEFAULT),
    ];
}

function createUser($conn, $userData) {
    $sql = "
        INSERT INTO users (
            first_name,
            last_name,
            phone_number,
            email,
            login_identifier,
            role,
            password_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        return false;
    }

    $stmt->bind_param(
        "sssssss",
        $userData['first_name'],
        $userData['last_name'],
        $userData['phone_number'],
        $userData['email'],
        $userData['login_identifier'],
        $userData['role'],
        $userData['password_hash']
    );

    return $stmt->execute();
}

?>
