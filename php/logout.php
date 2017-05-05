<?php
  header('content-type: application/json; charset=utf-8');
  header("access-control-allow-origin: *");
  session_start();
  $_SESSION = array();

  session_destroy();
?>
