accessAllowed('s', sessionStorage.Instructor);

let questionsLoaded = null;
let currentQuestion = 0;
let questionCount = null;
let examID = null;
let examStarted = false;
let examName = null;
let ucid = null;

// used for modal view
let tempExamID = null;
let tempExamName = null;

const SIDEBAR_DIV = 'sidebar';
const CONTAINER_DIV = 'other-half';

const startup = (session) => {
    showLoading(document.getElementById(SIDEBAR_DIV));
    ucid = session.UCID;
    apiCall('getExams.php', `&UCID=${session.UCID}`).then(JSON.parse).then((result) => {
        if ((result.Exams === undefined || result.Exams === null
          || result.Exams.length === 0) && result.success) {
            showMessage('There are no exams yet :(');
            doneLoading();

            return;
        }

        examsLoaded = result.Exams;
        const examsList = result.Exams.map(exam => `<div data-exam-id=${exam.id} data-exam-name=${exam.displayName} onclick="linkClick(this)" class="sidebar-element">${exam.displayName}</div>`).reduce((acc, val) => acc + val, '');

        document.getElementById(SIDEBAR_DIV).insertAdjacentHTML('beforeend', examsList);
        doneLoading();
    })
    .catch((err) => {
        doneLoading();
        showMessage('Sorry, something went wrong');
    });
};

const clearQuestionView = () => {
    const parentNode = document.getElementById(CONTAINER_DIV).parentNode;
    parentNode.removeChild(document.getElementById(CONTAINER_DIV));
    parentNode.insertAdjacentHTML('beforeend', '<div id="other-half"></div>');
};


const changeButtons = () => {
    document.getElementById(CONTAINER_DIV).removeChild(document.getElementById('button-section'));
    if (questionsLoaded.length === 1) {
        document.getElementById(CONTAINER_DIV).insertAdjacentHTML('beforeend', '<div id="button-section"><button id ="next" onclick="onSubmit()">Submit</button><button id ="previous" onclick="previousClick()">Previous</button></div>');
    } else {
        document.getElementById(CONTAINER_DIV).insertAdjacentHTML('beforeend', '<div id="button-section"><button id ="next" onclick="nextClick()">Next</button><button id ="previous" onclick="previousClick()">Previous</button></div>');
    }
};

const changeQuestionHeader = (question) => {
    document.getElementById('question-header').innerText = `Question ${currentQuestion + 1} of ${questionCount} (${question.value} ${question.value === '1' ? 'pt.' : 'pts.'})`;
};

const countTabs = (substr) => {
    let count = 0;

    let startScanning = false;
    let i = substr.length - 1;
    while (i > 0) {
        if (substr.charAt(i) === '\t') {
            startScanning = true;
            count += 1;
        } else if (substr.charAt(i) === '\n') {
            break;
        } else if (startScanning) {
            break;
        }
        i -= 1;
    }

    return count;
};

const repeatTab = (count) => {
    let returnStr = '';
    for (let j = 0; j < count; j += 1) {
        returnStr += '\t';
    }
    return returnStr;
};


const addTab = (e) => {
    const s = e.target.selectionStart;

    if (e.keyCode === 9) {
        e.preventDefault();
        e.target.value = `${e.target.value.substring(0, s)}\t${e.target.value.substring(e.target.selectionEnd)}`;
        e.target.selectionEnd = s + 1;
    } else if (e.keyCode === 13) {
        e.preventDefault();

        const addingThisManyTabs = countTabs(e.target.value.substring(0, s));
        if (e.target.value.charAt(s - 1) === '{') {
            e.target.value = `${e.target.value.substring(0, s)}\n${repeatTab(addingThisManyTabs + 1)}\n${repeatTab(addingThisManyTabs)}${e.target.value.substring(s)}`;
            e.target.selectionEnd = s + countTabs(e.target.value.substring(0, s)) + 2;
        } else {
            e.target.value = `${e.target.value.substring(0, s)}\n${repeatTab(addingThisManyTabs)}${e.target.value.substring(e.target.selectionEnd)}`;
            e.target.selectionEnd = s + countTabs(e.target.value.substring(0, s)) + 1;
        }
    }
};

const addClosing = (e) => {
    let s = null;
    if (e.keyCode === 40) {
        e.preventDefault();
        s = e.target.selectionStart;
        e.target.value = `${e.target.value.substring(0, s)}()${e.target.value.substring(e.target.selectionEnd)}`;
        e.target.selectionEnd = s + 1;
    } else if (e.keyCode === 123) {
        e.preventDefault();
        s = e.target.selectionStart;
        e.target.value = `${e.target.value.substring(0, s)}{}${e.target.value.substring(e.target.selectionEnd)}`;
        e.target.selectionEnd = s + 1;
    } else if (e.keyCode === 91) {
        e.preventDefault();
        s = e.target.selectionStart;
        e.target.value = `${e.target.value.substring(0, s)}[]${e.target.value.substring(e.target.selectionEnd)}`;
        e.target.selectionEnd = s + 1;
    } else if (e.keyCode === 34) {
        e.preventDefault();
        s = e.target.selectionStart;
        if (e.target.selectionStart !== e.target.selectionEnd) {
            e.target.value = `${e.target.value.substring(0, e.target.selectionStart - 1)}"${e.target.value.substring(e.target.selectionStart, e.target.selectionEnd)}"${e.target.value.substring(e.target.selectionEnd + 1)}`;
        } else {
            e.target.value = `${e.target.value.substring(0, s)}""${e.target.value.substring(e.target.selectionEnd)}`;
            e.target.selectionEnd = s + 1;
        }
    } else if (e.keyCode === 39) {
        e.preventDefault();
        s = e.target.selectionStart;
        if (e.target.selectionStart !== e.target.selectionEnd) {
            e.target.value = `${e.target.value.substring(0, e.target.selectionStart - 1)}'${e.target.value.substring(e.target.selectionStart, e.target.selectionEnd)}'${e.target.value.substring(e.target.selectionEnd + 1)}`;
        } else {
            e.target.value = `${e.target.value.substring(0, e.target.selectionStart)}''${e.target.value.substring(e.target.selectionEnd)}`;
            e.target.selectionEnd = s + 1;
        }
    }
};
const onTextChange = (e) => {
    questionsLoaded[currentQuestion].answer = e.target.value;
};

const changeQuestionView = () => {
    const questionText = document.getElementById('question-text');
    const answerText = document.getElementById('question-answer');

    questionText.innerText = questionsLoaded[currentQuestion].text;
    answerText.value = questionsLoaded[currentQuestion].answer;
    changeQuestionHeader(questionsLoaded[currentQuestion]);
};

const validation = () => {
    let accept = true;
    const invalid = [];
    questionsLoaded.forEach((qu, index) => {
        if (qu.answer === '') {
            qu.className = 'reject';
            invalid.push(index + 1);
            accept = false;
        }
    });

    if (!accept) {
        const errString = `You missed some questions: ${invalid.join()}`;
        showMessage(errString);
    }

    return accept;
};

const onSubmit = () => {
    if (!validation()) {
        document.getElementById('next').classList.add('disabled');
        return;
    }
    document.getElementById('next').classList.remove('disabled');


    showLoading(document.getElementById('question-view'));
    const submission = questionsLoaded.map((qu) => {
        const postString = `&ExamID=${examID}&QuestionID=${qu.id}&UCID=${ucid}&UserTextBox=${encodeURIComponent(qu.answer)}`;
        return apiCall('submitAnswer.php', postString);
        console.log(postString);
    });

    Promise.all(submission).then((res) => {
        doneLoading();
        console.log(res);
        parsedResults = res.map(JSON.parse);
        let success = true;
        parsedResults.forEach((individualResult) => {
            if (!individualResult.success) {
                success = false;
            }
        });

        if (success) {
            window.location.href = './grade-results.html';
        } else {
            showMessage('Oops, there was a problem submitting your answers. Try again later.');
        }
    })
    .catch((err) => {
        doneLoading();
        showMessage('Sorry, something went wrong');
    });
};

const nextClick = () => {
    if (currentQuestion === questionsLoaded.length - 2) {
        currentQuestion += 1;
        changeQuestionView();
        document.getElementById('next').innerText = 'Submit';
        document.getElementById('next').onclick = onSubmit;
    }

    if (currentQuestion < questionsLoaded.length - 2) {
        currentQuestion += 1;
        changeQuestionView();
    }


    if (currentQuestion === 1) {
        document.getElementById('previous').classList.remove('disabled');
    }
};

const previousClick = () => {
    if (currentQuestion > 0) {
        currentQuestion -= 1;
        changeQuestionView();
    }

    if (currentQuestion === 0) {
        document.getElementById('previous').classList.add('disabled');
    }
    if (currentQuestion === questionsLoaded.length - 2) {
        document.getElementById('next').innerText = 'Next';
        document.getElementById('next').onclick = nextClick;
        document.getElementById('next').classList.remove('disabled');
    }
};

const openModal = (message) => {
    const modalDiv = `
  <div id="modal">
    <div id="modal-content">
      <div id="modal-text">
        <p>${message}</p>
      </div>
      <div id="modal-footer">
        <div id="button-group">
            <div id="cancel-button" onclick="modalChoice(false);">Cancel</div>
            <div id="confirm-button" onclick="modalChoice(true);">Confirm</div>
        </div>
      </div>
    </div>
  </div>`;

    document.getElementById('message-view').insertAdjacentHTML('afterend', modalDiv);
};

const closeModal = () => {
    document.getElementById('modal').parentNode.removeChild(document.getElementById('modal'));
};

const chooseExam = () => {
    clearQuestionView();
    showLoading();
    document.getElementById(SIDEBAR_DIV).classList.add('sidebar-closed');
    document.getElementById(CONTAINER_DIV).classList.add('full-width');
    apiCall('getExam.php', `&ExamID=${examID}`).then(JSON.parse).then((exam) => {
        if (!exam.success) {
            return;
        }

        if (exam.Questions === null && exam.success) {
            return;
        }
        questionsLoaded = exam.Questions.map(question => ({
            text: question.QuestionString,
            id: question.id,
            value: question.QuestionValue,
            answer: '',
            className: '',
        }));
        questionCount = questionsLoaded.length;
        currentQuestion = 0;
        // document.getElementById('exam-name').innerText = examName;


        if (!document.getElementById('question-header')) {
            const examView = `<div id="question-view">
                            <h3 id="question-header"></h3>
                            <div id="question-text"></div>
                                <textarea id="question-answer" onkeydown="addTab(event)" onkeypress="addClosing(event)" onchange="onTextChange(event)"></textarea>
                            </div>
                            <div id="button-section">
                              <button id ="next" onclick="nextClick()">Next</button>
                              <button id ="previous" onclick="previousClick()">Previous</button>
                            </div>`;
            document.getElementById(CONTAINER_DIV).insertAdjacentHTML('beforeend', examView);
        }
        changeQuestionView();
        changeButtons();
        closeMessage();
        doneLoading();
    })
    .catch((err) => {
        doneLoading();
        showMessage('Sorry, something went wrong');
    });
};

const modalChoice = (val) => {
    if (val) {
        examID = tempExamID;
        examName = tempExamName;
        chooseExam();
    }
    tempExamID = null;
    tempExamName = null;
    closeModal();
};

const linkClick = (elem) => {
    if (examStarted) {
        if (elem.dataset.examId === examID) {
            // return;
        }
        tempExamID = elem.dataset.examId;
        tempExamName = elem.dataset.examName;
        openModal('If you switch exams, your answers will be lost. Are you sure you want to continue?');
    } else {
        examID = elem.dataset.examId;
        examName = elem.dataset.examName;
        chooseExam();
        examStarted = true;
    }
};
