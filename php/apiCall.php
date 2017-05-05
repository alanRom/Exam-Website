<?php
    header('content-type: application/json; charset=utf-8');
    header("access-control-allow-origin: *");
    $url = "http://afsaccess1.njit.edu/~cme9/";
    $url = $url . $_POST['Dir'];

    unset($_POST['Dir']);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER,true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $_POST);
    $middle_output = curl_exec($ch);
    curl_close($ch);
    //
    echo $middle_output;
?>
