let session = {};

const apiCall = (endpoint, postString) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let appendedPostString = postString;
    const url = 'https://web.njit.edu/~ajr42/490Project/php/apiCall.php';

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    if (postString === undefined) {
        appendedPostString = `&Dir=${endpoint}`;
    } else {
        appendedPostString += `&Dir=${endpoint}`;
    }
    xhr.send(appendedPostString);
    xhr.onreadystatechange = function change() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const resp = xhr.responseText;
                resolve(resp);
            } else {
                reject(xhr.status);
            }
        }
    };
});

const accessAllowed = (whoIsAllowed, sessionVar) => {
    if (whoIsAllowed === 'i') {
        if (!session.Instructor) {
            window.location.replace('../html/landing-page.html');
            return false;
        }
    } else if (session.Instructor) {
        window.location.replace('../html/landing-page.html');
        return false;
    }
    return true;
};

const localCall = (url, postString) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    if (postString === undefined) {
        xhr.send();
    } else {
        xhr.send(postString);
    }
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const resp = xhr.responseText;
                resolve(JSON.parse(resp));
            } else {
                reject(xhr.status);
            }
        }
    };
});


const sessionFetch = () => new Promise((resolve, reject) => {
    if (sessionStorage.length === 0 || sessionStorage.UCID === 'null' || sessionStorage.UCID === null || sessionStorage.UCID === 'undefined') {
        reject(sessionStorage);
    } else {
        const sessionCompatability = {
            UCID: sessionStorage.UCID,
            Instructor: sessionStorage.Instructor === 'i',
        };
        resolve(sessionCompatability);
    }
});

const goHome = function () {
    location.href = 'landing-page.html';
};


const removeValidation = (e) => {
    if (e.target.classList.contains('reject')) {
        e.target.classList.remove('reject');
    }
};

const logout = () => {
    sessionStorage.UCID = null;
    sessionStorage.Instructor = null;
    apiCall('../php/logout.php').then(() => {
        window.location.href = '../login.html';
    });
};

const showLoading = (target) => {
    const loadingDiv = `<div id="loading-screen">
        <div id="loading-icon">
            <svg width='100px' height='100px' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="uil-ring-alt"><rect x="0" y="0" width="100" height="100" fill="none" class="bk"></rect><circle cx="50" cy="50" r="40" stroke="#afafb7" fill="none" stroke-width="10" stroke-linecap="round"></circle><circle cx="50" cy="50" r="40" stroke="#5cffd6" fill="none" stroke-width="6" stroke-linecap="round"><animate attributeName="stroke-dashoffset" dur="2s" repeatCount="indefinite" from="0" to="502"></animate><animate attributeName="stroke-dasharray" dur="2s" repeatCount="indefinite" values="150.6 100.4;1 250;150.6 100.4"></animate></circle></svg>
    </div>`;
    let attachingNode = document.body;
    if (target !== undefined) {
        attachingNode = target;
    }

    if (document.getElementById('loading-screen')) {
        return;
    }

    attachingNode.insertAdjacentHTML('afterbegin', loadingDiv);
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('finish-load');
    }, 3);
};

const doneLoading = () => {
    if (!document.getElementById('loading-screen')) {
        return;
    }

    const removingNode = document.getElementById('loading-screen').parentNode;

    document.getElementById('loading-screen').classList.remove('finish-load');
    setTimeout(() => {
        removingNode.removeChild(document.getElementById('loading-screen'));
    }, 510);
};


const addInstructorView = () => {
    const sidebar = document.getElementById('logo');
    const divVar = '<div id="instructor-view"><a href="add-question.html">Add a Question</a><a href="add-test-case.html">Add Test Cases</a><a href="select-questions.html">Make an Exam</a><a href="exam-info.html">Exam Info</a><a href="grade-results.html">Grading Results</a></div>';
    sidebar.insertAdjacentHTML('afterend', divVar);
};

const addStudentView = () => {
    const sidebar = document.getElementById('logo');
    const divVar = '<div id="student-view"><a class ="sidebar-element" href="take-exam.html">Take an Exam</a><a href="view-grades.html">View Grades</a></div>';
    sidebar.insertAdjacentHTML('afterend', divVar);
};

const closeMessage = () => {
    document.getElementById('message-view').classList.add('closed');
};

const showMessage = (message, url) => {
    if (url !== undefined) {
        document.getElementById('message-view').onclick = (route) => {
            window.location.href = route;
        };
    }
    document.getElementById('message-view').innerHTML = message;
    document.getElementById('message-view').classList.remove('closed');
    setTimeout(closeMessage, 10000);
};


const makeDifficultyFilterOptions = () => {
    const difficultyDropdown = document.getElementById('select-difficulty');
    let divString = '';
    [{ val: 'All', label: 'Difficulty' },
     { val: 1, label: 'Easy' },
      { val: 2, label: 'Medium' },
      { val: 3, label: 'Hard' },
    ].forEach((type) => {
        divString += `<option value=${type.val}>${type.label}</option>`;
    });
    difficultyDropdown.insertAdjacentHTML('beforeend', divString);
};

const makeTypeFilterOptions = () => {
    const typeDropdown = document.getElementById('select-type');
    let divString = '';
    ['Type', 'None', 'For', 'While', 'Recursion', 'Overload'].forEach((type) => {
        divString += `<option value=${type}>${type}</option>`;
    });
    typeDropdown.insertAdjacentHTML('beforeend', divString);
};


// ///////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////
// ///////////////////////////////////

sessionFetch().then((res) => {
    session = res;
}).catch((res) => {
    window.location.replace('../login.html');
});

window.onload = () => {
    if (session.Instructor) {
        addInstructorView();
    } else {
        addStudentView();
    }


    startup(session);
};
