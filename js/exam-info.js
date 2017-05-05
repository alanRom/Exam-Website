let examID = null;
let examName = '';
let examsLoaded = null;
let takable = null;
let gradesReleased = null;

const startup = (session) => {
    if(!accessAllowed('i', session.Instructor)) return;
    showLoading(document.getElementById('sidebar'));
    apiCall('getExams.php', `&UCID=${session.UCID}`).then(JSON.parse).then((result) => {
        console.log(result);
        if((result.Exams === undefined || result.Exams === null || result.Exams.length === 0) && result.success){
            showMessage('You haven\'t made any exams yet :(');
            doneLoading();

            return;
        }

        examsLoaded = result.Exams;
        const examsList = result.Exams.map((exam) => {
            return `<div data-exam-id=${exam.id} onclick="linkClick(this)" class="sidebar-element">${exam.displayName}</div>`;
        }).reduce((acc, val) =>{
            return acc + val;
        }, '');

        document.getElementById('sidebar').insertAdjacentHTML('beforeend', examsList);
        doneLoading();
    });

};


const getExamIndex = (id) => {
    for (var i = examsLoaded.length - 1; i >= 0; i--) {
        if (examsLoaded[i].id === id) {
            return i;
        }
    }
    return -1;
};

const changeExam = () =>{
    showLoading();
    document.getElementById('sidebar').classList.add('sidebar-closed');
    document.getElementById('other-half').classList.add('full-width');

    takable = examsLoaded[getExamIndex(examID)].releasedForTaking === '1';
    gradesReleased = examsLoaded[getExamIndex(examID)].gradesReleased === '1';
    apiCall('getExam.php', `&ExamID=${examID}`).then(JSON.parse).then((res)=> {

        clearExamView();
        examName = examsLoaded[getExamIndex(examID)].displayName;

        const divString = res.Questions.map((question) => {
            return `<div class="question"><div class="question-header">Question ${question.id}</div><div class="question-text">${question.QuestionString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div><div class="question-property">Difficulty: ${question.Difficulty}</div><div class="question-property">Value: ${question.QuestionValue}</div><div class="question-property">Question Type: ${question.Type}</div></div>`;
        }).reduce((acc, val) => {
            return acc+val;
        }, '');

        if(!document.getElementById('release-check')){
            document.getElementById('release-view').insertAdjacentHTML('beforeend','<label>Allow students to take this exam</label><input id="release-check" type="checkbox" onchange="releaseForTaking()"></input>');
        }
        document.getElementById('release-check').checked = takable;


        document.getElementById('exam-name').innerText = examName;

        document.getElementById('questions-view').insertAdjacentHTML('beforeend', divString);
        doneLoading();
    });
};

const clearExamView =() => {
    if(!document.getElementById('questions-view')) return;
    const parent = document.getElementById('questions-view').parentNode;
    parent.removeChild(document.getElementById('questions-view'));
    parent.insertAdjacentHTML('beforeend', '<div id="questions-view"></div>');
};

const linkClick = (elem) => {
    examID = elem.dataset.examId;
    changeExam();
};

const releaseForTaking = () => {
    takable = !takable;
    const postString = `&ExamID=${examID}&ReleasedForTaking=${takable ? '1' : '0'}&GradesReleased=${gradesReleased ? '1' : '0'}`;
    apiCall('setExam.php', postString).then(JSON.parse).then((res) => {

    });
};
