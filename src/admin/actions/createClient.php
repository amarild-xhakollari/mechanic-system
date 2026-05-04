<?php

require_once __DIR__ . "/../../auth/session.php";
requireAdminJson();

$conn=require __DIR__ . "/../../config/db.php";

print_r($_POST);

$firstName = $_POST['firstName'];
$lastName = $_POST['lastName'];
$email = $_POST['email'];
$phone = $_POST['phone'];
$password = password_hash($_POST['password'],PASSWORD_DEFAULT);
$role = 'client';

$query = "INSERT INTO users (first_name, last_name, phone_number, email, login_identifier, role,password_hash) VALUES ('$firstName', '$lastName', '$phone', '$email', null , '$role', '$password')";

if ($conn->query($query) === TRUE) {
    echo "New client created successfully";
} else {
    echo "Error: " . $query . "<br>" . $conn->error;
}    

?>
