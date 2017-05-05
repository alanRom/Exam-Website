<?php
    header('content-type: application/json; charset=utf-8');
    header("access-control-allow-origin: *");
    session_start();
    echo json_encode($_SESSION);
 ?>
