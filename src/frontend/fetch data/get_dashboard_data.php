<?php

header("Content-Type: application/json");

require_once __DIR__ . "/../../login/auth/session.php";
startSessionIfNeeded();

require "dashboard_functions.php";

$conn = connect_to_database();
$data = get_dashboard_data($conn);

echo json_encode($data);

mysqli_close($conn);

?>
