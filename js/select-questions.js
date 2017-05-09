accessAllowed('i', sessionStorage.Instructor);

let questionsLoaded = null;
let questionsInBank = [];
let difficultySelected = 'All';
let typeSelected = 'Type';
const questionsSelected = [];
const examSelected = 1;
let maxGrade = 0;
let ucid = null;
const difficultyOptions = [{ val: 'All', label: 'Difficulty' }, { val: '1', label: 'Easy' }, { val: '2', label: 'Medium' }, { val: '3', label: 'Hard' }];
const typeOptions = ['Type', 'None', 'For', 'While', 'Recursion', 'Overload'];


const QUESTION_BANK_DIV = 'question-bank-view';
const QUESTION_POOL_DIV = 'questions-selected-view';

const getQuestionIndex = (id) => {
    for (let i = questionsLoaded.length - 1; i >= 0; i -= 1) {
        if (questionsLoaded[i].id === id) {
            return i;
        }
    }
    return -1;
};

const clearQuestionsBank = () => {
    const questionBank = document.getElementById(QUESTION_BANK_DIV);
    const deleteList = document.getElementsByClassName('question-in-bank');
    for (let i = deleteList.length - 1; i >= 0; i -= 1) {
        questionBank.removeChild(deleteList[i]);
    }
};

const updateMaxGrade = () => {
    let newCount = 0;
    questionsSelected.forEach((qId) => {
        const div = document.getElementById(qId);
        newCount += parseInt(div.childNodes[1].value, 10);
    });
    maxGrade = newCount;
    document.getElementById('max-grade').innerText = `Maximum Grade: ${maxGrade}`;
};

const addToPool = (id) => {
    if (questionsSelected.includes(id) || getQuestionIndex(id) === -1) {
        return;
    }
    const questionPool = document.getElementById(QUESTION_POOL_DIV);
    questionsSelected.push(id);
    const questionText = questionsLoaded[getQuestionIndex(id)].QuestionString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const newDiv = `<div class="wrapper" id="${id}"><div class="question-in-pool"  data-q-id="${id}" onclick="questionPoolClick(this);">${questionText}</div><input class="small-input" type="number" placeholder="value"  min="1" onchange="gradeValChange(event)"></input></div>`;
    questionPool.insertAdjacentHTML('beforeend', newDiv);
    document.getElementById(`${id}`).childNodes[1].defaultValue = '1';
    updateMaxGrade();
};

const questionBankClick = (elem) => {
    const removeIndex = questionsInBank.indexOf(elem.dataset.qId);
    questionsInBank.splice(removeIndex, 1);
    document.getElementById(elem.dataset.qId).parentNode
    .removeChild(document.getElementById(elem.dataset.qId));

    addToPool(elem.dataset.qId);
};

const gradeValChange = (e) => {
    updateMaxGrade();
    removeValidation(e);
};


const addToBank = function (id) {
    if (questionsInBank.includes(id) || getQuestionIndex(id) === -1) {
        return;
    }
    const questionBank = document.getElementById(QUESTION_BANK_DIV);
    questionsInBank.push(id);
    const questionText = questionsLoaded[getQuestionIndex(id)].QuestionString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const newDiv = `<div class="question question-in-bank" id="${id}" data-q-id="${id}" onclick="questionBankClick(this);">${questionText}</div>`;
    questionBank.insertAdjacentHTML('beforeend', newDiv);
};

const addQuestionsToBank = function () {
    clearQuestionsBank();
    const questionBank = document.getElementById(QUESTION_BANK_DIV);

    questionsInBank.forEach((id) => {
        if (questionsSelected.includes(id)) {
            return;
        }
        const questionText = questionsLoaded[getQuestionIndex(id)].QuestionString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const newDiv = `<div class="question question-in-bank" id="${id}" data-q-id="${id}" onclick="questionBankClick(this);">${questionText}</div>`;
        questionBank.insertAdjacentHTML('beforeend', newDiv);
    });

    doneLoading();
};

const questionPoolClick = (elem) => {
    const removeIndex = questionsSelected.indexOf(elem.dataset.qId);
    questionsSelected.splice(removeIndex, 1);
    document.getElementById(elem.dataset.qId).parentNode
    .removeChild(document.getElementById(elem.dataset.qId));

    addToBank(elem.dataset.qId);
};

const onSelect = () => {
    showLoading(document.getElementById(QUESTION_BANK_DIV));
    const difficulty = difficultySelected === 'All' ? '' : `${difficultySelected}`;
    const type = typeSelected === 'Type' ? '' : `${typeSelected}`;
    const postString = `Difficulty=${difficulty}&Type=${type}`;
    apiCall('getQuestions.php', postString).then(JSON.parse).then((questions) => {
        if (questions.Questions === null) {
            if (difficultySelected === 'All' && typeSelected !== 'Type') {
                showMessage(`Sorry, there are no ${typeSelected} questions.`);
            } else if (difficultySelected !== 'All' && typeSelected === 'Type') {
                showMessage(`Sorry, there are no ${difficultyOptions[parseInt(difficultySelected, 10)].label} questions.`);
            } else {
                showMessage(`Sorry, there are no ${difficultyOptions[parseInt(difficultySelected, 10)].label} ${typeSelected} questions.`);
            }
            doneLoading();
            return;
        }
        closeMessage();
        questionsLoaded = questions.Questions;
        questionsInBank = questionsLoaded.map(q => q.id);

        addQuestionsToBank();
    })
    .catch((err) => {
        doneLoading();
        showMessage('Sorry, something went wrong');
    });
};

const onDifficultySelect = (event) => {
    difficultySelected = event.target.value;
    onSelect();
};

const onTypeSelect = (event) => {
    typeSelected = event.target.value;
    onSelect();
};

const validation = () => {
    let accepted = true;
    if (questionsSelected.length === 0) {
        accepted = false;
    }

    const examName = document.getElementById('exam-name');

    if (examName.value === '') {
        examName.classList.add('reject');
        accepted = false;
    }

    questionsSelected.forEach((qId) => {
        const div = document.getElementById(qId);
        if (div.childNodes[1].value === '') {
            div.childNodes[1].classList.add('reject');
            accepted = false;
        }
    });

    return accepted;
};

const onSubmit = () => {
    if (!validation()) {
        return;
    }
    let url = 'createExam.php';
    const postString = `&UCID=instructor&ExamName=${document.getElementById('exam-name').value}&MaxGrade=${maxGrade}`;

    apiCall(url, postString).then(JSON.parse).then((examResult) => {
        url = 'addToExam.php';
        const sendQuestions = questionsSelected.map((qid, index) => {
            const qVal = document.getElementById(qid).childNodes[1].value;
            return apiCall(url, `&ExamID=${examResult.ExamID}&QuestionID=${qid}&QuestionValue=${qVal}&NumberInExam=${index + 1}`);
        });
        Promise.all(sendQuestions).then((res) => {
            let numberOfSuccess = 0;
            res.forEach((individualQuestion) => {
                const parsedIndividualQuestion = JSON.parse(individualQuestion);
                if (parsedIndividualQuestion.success) {
                    numberOfSuccess += 1;
                }
            });

            if (numberOfSuccess === res.length) {
                showMessage('The exam was created successfully');
            } else {
                showMessage('Sorry, something went wrong. Please try again later.');
            }
            window.scrollTo(0, 0);
        });
    })
    .catch((err) => {
        doneLoading();
        showMessage('Sorry, something went wrong');
    });
};


const startup = (session) => {
    showLoading(document.getElementById(QUESTION_BANK_DIV));
    ucid = session.UCID;
    apiCall('getQuestions.php').then(JSON.parse).then((questions) => {
        questionsLoaded = questions.Questions;
        questionsInBank = questionsLoaded.map(q => q.id);

        addQuestionsToBank();
        makeDifficultyFilterOptions();
        makeTypeFilterOptions();
    })
    .catch((err) => {
        doneLoading();
        showMessage('Sorry, something went wrong');
    });
};
