<?php

require_once __DIR__ . "/../../auth/session.php";
requireAdminJson();

$mysqli = require __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../actions/searchService.php";

header("Content-Type: application/json");

$q = trim($_GET["q"] ?? "");

if (strlen($q) < 2) {
    echo json_encode([]);
    exit;
}

echo json_encode(searchClients($mysqli, $q));

?>
