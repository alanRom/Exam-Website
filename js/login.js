if(!(sessionStorage.length === 0 ||sessionStorage.UCID === 'null' || sessionStorage.UCID === null || sessionStorage.UCID === 'undefined')){
    window.location.href = 'html/landing-page.html';

}
function checkInputs(){
    var ucidErr = document.getElementById('ID-error');
    var passErr = document.getElementById('Password-error');
    var validInput = true;

    var idString = document.forms['login-form']['ID'].value;
    var passString = document.forms['login-form']['Password'].value;

    if (idString === '' || idString === null){
        ucidErr.innerText='UCID cannot be blank';
        document.getElementById('ID').classList.add('err-input');
        validInput = false;
    }

    if(passString === '' || passString === null){
        passErr.innerText = 'Password cannot be blank';
        document.getElementById('Password').classList.add('err-input');
        validInput = false;
    }
    return validInput;
}

const showMessage = (message) => {
    document.getElementById('message-view').innerText = message;
    document.getElementById('message-view').classList.remove('closed');

};
const closeMessage = () => {
    document.getElementById('message-view').classList.add('closed');
};

function onTextChange(event){
    var targetId = event.target.id + '-error';
    document.getElementById(event.target.id).classList.remove('err-input');
    document.getElementById(targetId).innerText = '';
}


function changePage(results){
    if(results.BackendSuccess === true){
        window.location.href = 'html/landing-page.html';
    }else{
        showMessage('Sorry, your username and password were not recognized. Please try again.');
    }
}

function onSubmit(event) {
    event.preventDefault();
    if(!checkInputs()){
        return;
    }
    closeMessage();
    var url = 'http://afsaccess1.njit.edu/~ajr42/490Project/php/login.php';
    var postString = 'ID='+document.getElementById('ID').value+'&Password='+document.getElementById('Password').value;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(postString);
    xhr.onreadystatechange = function(){
        if (xhr.readyState === 4){
            if (xhr.status === 200){
                var resp = xhr.responseText;
                var respJson = JSON.parse(resp);
                sessionStorage.UCID = respJson.ucid;
                sessionStorage.Instructor = respJson.type;
                changePage(respJson);
            }
        }
    };
}

const showSection= () => {
    document.getElementById('about-section').classList.add('reveal');
};

const hideSection= () => {
    document.getElementById('about-section').classList.remove('reveal');
};
