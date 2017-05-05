<?php
    header('content-type: application/json; charset=utf-8');
    header("access-control-allow-origin: *");
    session_start();
    $url="http://afsaccess1.njit.edu/~cme9/loginMiddle.php";
    $post = ['ID' => $_POST["ID"],
              'Password' => $_POST["Password"]];
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER,true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post);

    $backend_output = curl_exec($ch);
    curl_close($ch);
    $parsed_output = json_decode($backend_output);
    if($parsed_output->BackendSuccess == true ){
      $_SESSION['UCID'] = $parsed_output->ucid;
      $_SESSION['Instructor'] = $parsed_output->type != 's'; //whether user is student or instructor
    }


    echo $backend_output;
?>
