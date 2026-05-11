<?php

header("Content-Type: application/json");

$token = $_GET["token"] ?? "";

if ($token !== "create-staff-2026") {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Invalid setup token."
    ]);
    exit;
}

$conn = require __DIR__ . "/../config/db.php";

$staff = [
    "first_name" => "Staff",
    "last_name" => "Dashboard",
    "phone_number" => "0677001999",
    "email" => "staff.dashboard@mechanic.test",
    "login_identifier" => "stf01",
    "password" => "12345",
    "role" => "staff"
];

$passwordHash = password_hash($staff["password"], PASSWORD_DEFAULT);

$existingStmt = $conn->prepare("
    SELECT user_id
    FROM users
    WHERE login_identifier = ?
       OR email = ?
       OR phone_number = ?
    LIMIT 1
");

if (!$existingStmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not prepare staff lookup."
    ]);
    exit;
}

$existingStmt->bind_param("sss", $staff["login_identifier"], $staff["email"], $staff["phone_number"]);

if (!$existingStmt->execute()) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not run staff lookup."
    ]);
    exit;
}

$existing = $existingStmt->get_result()->fetch_assoc();

if ($existing) {
    $stmt = $conn->prepare("
        UPDATE users
        SET first_name = ?,
            last_name = ?,
            phone_number = ?,
            email = ?,
            role = ?,
            password_hash = ?
        WHERE user_id = ?
    ");

    if (!$stmt) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Could not prepare staff update."
        ]);
        exit;
    }

    $userId = (int) $existing["user_id"];
    $stmt->bind_param(
        "ssssssi",
        $staff["first_name"],
        $staff["last_name"],
        $staff["phone_number"],
        $staff["email"],
        $staff["role"],
        $passwordHash,
        $userId
    );
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Could not update staff user."
        ]);
        exit;
    }
} else {
    $stmt = $conn->prepare("
        INSERT INTO users
            (first_name, last_name, phone_number, email, login_identifier, role, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Could not prepare staff insert."
        ]);
        exit;
    }

    $stmt->bind_param(
        "sssssss",
        $staff["first_name"],
        $staff["last_name"],
        $staff["phone_number"],
        $staff["email"],
        $staff["login_identifier"],
        $staff["role"],
        $passwordHash
    );
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Could not insert staff user."
        ]);
        exit;
    }

    $userId = (int) $conn->insert_id;
}

echo json_encode([
    "success" => true,
    "message" => "Default staff credentials are ready.",
    "user_id" => $userId,
    "login_identifier" => $staff["login_identifier"],
    "email" => $staff["email"],
    "phone_number" => $staff["phone_number"],
    "password" => $staff["password"]
]);

?>
