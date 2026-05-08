<?php

function fetchOneUser($conn, $sql, $types, ...$values) {
    if (!$conn) {
        return null;
    }

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        error_log("User lookup prepare failed: " . $conn->error);
        return null;
    }

    $stmt->bind_param($types, ...$values);

    if (!$stmt->execute()) {
        error_log("User lookup execute failed: " . $stmt->error);
        return null;
    }

    $result = $stmt->get_result();
    return $result ? $result->fetch_assoc() : null;
}

function findUserByPhone($conn, $phone) {
    $phone = trim($phone ?? "");

    if ($phone === "") {
        return null;
    }

    return fetchOneUser(
        $conn,
        "SELECT * FROM users WHERE phone_number = ? AND role = 'client' LIMIT 1",
        "s",
        $phone
    );
}

function findUserByIdentifier($conn, $identifier) {
    $identifier = trim($identifier ?? "");

    if ($identifier === "") {
        return null;
    }

    return fetchOneUser(
        $conn,
        "SELECT * FROM users WHERE login_identifier = ? LIMIT 1",
        "s",
        $identifier
    );
}

function findStaffUserByLogin($conn, $login) {
    $login = trim($login ?? "");

    if ($login === "") {
        return null;
    }

    return fetchOneUser(
        $conn,
        "
            SELECT *
            FROM users
            WHERE role = 'staff'
              AND (
                login_identifier = ?
                OR email = ?
                OR phone_number = ?
              )
            LIMIT 1
        ",
        "sss",
        $login,
        $login,
        $login
    );
}

?>
