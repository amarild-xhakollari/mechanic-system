<?php

require_once __DIR__ . "/../../auth/session.php";
requireAdminJson();

$conn=require __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../audit/audit_logger.php";
require_once __DIR__ . "/../../notifications/notification_service.php";

print_r($_POST);

$firstName = $_POST['firstName'];
$lastName = $_POST['lastName'];
$email = $_POST['email'];
$phone = $_POST['phone'];
$plainPassword = $_POST['password'];
$password = password_hash($plainPassword,PASSWORD_DEFAULT);
$role = 'client';

$query = "INSERT INTO users (first_name, last_name, phone_number, email, login_identifier, role,password_hash) VALUES ('$firstName', '$lastName', '$phone', '$email', null , '$role', '$password')";

if ($conn->query($query) === TRUE) {
    $clientId = (int) $conn->insert_id;
    audit_log_event($conn, [
        "action" => "INSERT",
        "entity_type" => "users",
        "entity_id" => $clientId,
        "entity_label" => $firstName . " " . $lastName,
        "description" => "Create Klient - " . $firstName . " " . $lastName,
        "new_values" => [
            "role" => "client",
            "first_name" => $firstName,
            "last_name" => $lastName,
            "phone" => $phone,
            "email" => $email
        ],
        "changed_fields" => ["role", "first_name", "last_name", "phone", "email"]
    ]);
    notify_user_profile_created($conn, $clientId, $plainPassword, $phone);
    echo "New client created successfully";
} else {
    echo "Error: " . $query . "<br>" . $conn->error;
}    

?>
