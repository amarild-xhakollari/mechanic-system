<?php

$conn=require __DIR__ . "/../configs/db.php";

$clinet_id="";
$car_model_id= "";
$plate_number= "";
$vin= "";

$query="INSERT INTO vehicles (client_id,car_model_id,plate_number,vin) VALUES('$clinet_id','$car_model_id','$plate_number','$vin')";

if($conn->query($query)===true){

    echo "new vehicle added";

} else {
    echo "Error: " . $query . "<br>" . $conn->error;

}


?>