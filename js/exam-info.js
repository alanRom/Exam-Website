accessAllowed('i', sessionStorage.Instructor);

let examID = null;
let examName = '';
let examsLoaded = null;
let takable = null;
let gradesReleased = null;

const QUESTIONS_VIEW_DIV = 'questions-view';
const EXAM_NAME_DIV = 'exam-name';
const SIDEBAR_DIV = 'sidebar';
const CONTAINER_DIV = 'other-half';

const startup = (session) => {
    showLoading(document.getElementById(SIDEBAR_DIV));
    apiCall('getExams.php', `&UCID=${session.UCID}`).then(JSON.parse).then((result) => {
        console.log(result);
        if ((result.Exams === undefined || result.Exams === null
          || result.Exams.length === 0) && result.success) {
            showMessage('You haven\'t made any exams yet :(');
            doneLoading();

            return;
        }

        examsLoaded = result.Exams;
        const examsList = result.Exams.map(exam => `<div data-exam-id=${exam.id} onclick="linkClick(this)" class="sidebar-element">${exam.displayName}</div>`).reduce((acc, val) => acc + val, '');

        document.getElementById(SIDEBAR_DIV).insertAdjacentHTML('beforeend', examsList);
        doneLoading();
    })
    .catch((err) => {
        doneLoading();
        showMessage('Sorry, something went wrong');
    });
};


const getExamIndex = (id) => {
    for (let i = examsLoaded.length - 1; i >= 0; i -= 1) {
        if (examsLoaded[i].id === id) {
            return i;
        }
    }
    return -1;
};

const clearExamView = () => {
    if (!document.getElementById(QUESTIONS_VIEW_DIV)) return;
    const parent = document.getElementById(QUESTIONS_VIEW_DIV).parentNode;
    parent.removeChild(document.getElementById(QUESTIONS_VIEW_DIV));
    parent.insertAdjacentHTML('beforeend', '<div id="questions-view"></div>');
};

const changeExam = () => {
    showLoading();
    document.getElementById(SIDEBAR_DIV).classList.add('sidebar-closed');
    document.getElementById(CONTAINER_DIV).classList.add('full-width');

    takable = examsLoaded[getExamIndex(examID)].releasedForTaking === '1';
    gradesReleased = examsLoaded[getExamIndex(examID)].gradesReleased === '1';
    apiCall('getExam.php', `&ExamID=${examID}`).then(JSON.parse).then((res) => {
        clearExamView();
        examName = examsLoaded[getExamIndex(examID)].displayName;

        const divString = res.Questions.map(question => `<div class="question-block"><div class="question-header">Question ${question.id}</div><div class="question-text">${question.QuestionString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div><div class="question-property">Difficulty: ${question.Difficulty}</div><div class="question-property">Value: ${question.QuestionValue}</div><div class="question-property">Question Type: ${question.Type}</div></div>`).reduce((acc, val) => acc + val, '');

        if (!document.getElementById('release-check')) {
            document.getElementById('release-view').insertAdjacentHTML('beforeend', '<label>Allow students to take this exam</label><input id="release-check" type="checkbox" onchange="releaseForTaking()"></input>');
        }
        document.getElementById('release-check').checked = takable;


        document.getElementById(EXAM_NAME_DIV).innerText = examName;

        document.getElementById(QUESTIONS_VIEW_DIV).insertAdjacentHTML('beforeend', divString);
        doneLoading();
    })
    .catch((err) => {
        doneLoading();
        showMessage('Sorry, something went wrong');
    });
};

const linkClick = (elem) => {
    examID = elem.dataset.examId;
    changeExam();
};

const releaseForTaking = () => {
    closeMessage();
    takable = !takable;
    const postString = `&ExamID=${examID}&ReleasedForTaking=${takable ? '1' : '0'}&GradesReleased=${gradesReleased ? '1' : '0'}`;
    apiCall('setExam.php', postString).then((res) => {
        console.log('done');
        showMessage(`Students ${takable ? 'can' : 'cannot'} take this exam now.`);
    });
};
