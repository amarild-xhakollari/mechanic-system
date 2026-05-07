<?php

$conn = require __DIR__ . "/../../config/db.php";

$sql = "
    UPDATE vehicles
    SET
        plate_number = TRIM(REPLACE(plate_number, 'BULK ', '')),
        vin = REPLACE(vin, 'BULK-', '')
    WHERE plate_number LIKE 'BULK %'
       OR vin LIKE 'BULK-%'
";

if (!$conn->query($sql)) {
    echo json_encode([
        "success" => false,
        "message" => "Could not remove BULK prefixes.",
        "error" => $conn->error
    ], JSON_PRETTY_PRINT);
    exit;
}

echo json_encode([
    "success" => true,
    "affected_rows" => $conn->affected_rows
], JSON_PRETTY_PRINT);

?>
