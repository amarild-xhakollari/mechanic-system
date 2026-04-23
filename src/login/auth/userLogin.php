<?php

function findUserByPhone($conn, $phone) {
    $sql = "SELECT * FROM users WHERE phone_number = ? LIMIT 1";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $phone);
    $stmt->execute();

    $result = $stmt->get_result();
    return $result->fetch_assoc();
}

function findUserByIdentifier($conn, $identifier) {
    $sql = "SELECT * FROM users WHERE login_identifier = ? LIMIT 1";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $identifier);
    $stmt->execute();

    $result = $stmt->get_result();
    return $result->fetch_assoc();
}

?>