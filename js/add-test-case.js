let questionsLoaded = null;
const questionSelectedText = '';
let questionSelected = '';
let difficultySelected = 'All';
let typeSelected = 'Type';
let ucid = null;
const problemTypes = ['None', 'For', 'While', 'Recursion', 'Overload'];
const difficultyOptions = [{ val: 1, label: 'Easy' }, { val: 2, label: 'Medium' }, { val: 3, label: 'Hard' }];
const returnTypes = ['int', 'String', 'float', 'double', 'boolean'];

const startup = (session) => {
    if (!accessAllowed('i', session.Instructor)) return;
    showLoading(document.getElementById('question-bank-view'));
    ucid = session.UCID;
    apiCall('getQuestions.php').then(JSON.parse).then((questions) => {
        document.getElementById('bank-header').innerText = 'Choose a Question';
        questionsLoaded = questions.Questions;

        addQuestionsToBank();
        makeTypeFilterOptions();
        makeDifficultyFilterOptions();
    });
};


const getQuestionIndex = (id) => {
    for (let i = questionsLoaded.length - 1; i >= 0; i -= 1) {
        if (questionsLoaded[i].id === id) {
            return i;
        }
    }
    return -1;
};

const changeHeader = () => {
    document.getElementById('question-header').innerText = `${questionsLoaded[getQuestionIndex(questionSelected)].QuestionString}`;
};

const getAvailableParams = (id) => {
    const question = questionsLoaded[getQuestionIndex(id)];

    const params = ['Param1_Type', 'Param2_Type', 'Param3_Type', 'Param4_Type'];

    return params.map((param, index) => {
        if (question[param] !== '') {
            return index + 1;
        }

        return undefined;
    }).filter(param => param !== undefined);
};

const validation = () => {
    let accept = true;

    if (questionSelected === '') {
        showMessage('Please choose a question');
        accept = false;
        return accept;
    }
    closeMessage();


    getAvailableParams(questionSelected).forEach((paramCount) => {
        const div = document.getElementsByName(`Param${paramCount}`)[0];
        if (div.value === '') {
            div.classList.add('reject');
            accept = false;
        } else {
            div.classList.remove('reject');
        }
    });
    return accept;
};

const onSubmit = (e) => {
    e.preventDefault();

    const fields = ['Param1', 'Param2', 'Param3', 'Param4', 'Output'];

    if (!validation()) {
        return;
    }
    let paramString = '';
    for (let i = 0; i < 4; i++){
        if(i !== 0 && document.getElementsByName(fields[i])[0].value !== '') {
            paramString += ', ';
        }

        paramString += document.getElementsByName(fields[i])[0].value;
    }

    const testCaseDiv = `<div class="loaded-test-case">(${paramString}) => ${document.getElementsByName(fields[4])[0].value}<br /></div>`;

    console.log(testCaseDiv);


    let postString = fields.map(field => `${field}=${encodeURIComponent(document.getElementsByName(field)[0].value)}&`).reduce((acc, val) => acc + val, '&');
    postString += `QuestionID=${questionSelected}`;
    apiCall('addTestCase.php', postString).then(JSON.parse).then((res) => {
        if (res.success) {
            showMessage('The test case was created successfully');
            document.getElementById('test-case-section').insertAdjacentHTML('beforeend', testCaseDiv);
        } else {
            showMessage('Sorry, something went wrong. Please try again later.');
        }
        window.scrollTo(0, 0);
    });
};


const clearTestCases = () => {
    const deletingList = document.getElementsByClassName('loaded-test-case');
    for(let j = deletingList.length -1 ; j >= 0 ; j --){
        document.getElementById('test-case-section').removeChild(deletingList[j]);
    }
};
const getTestCases = () => {
    clearTestCases();
    closeMessage();
    showLoading(document.getElementById('test-case-section'));
    apiCall('getTestCases.php', `&QuestionID=${questionSelected}`).then(JSON.parse).then(result => {
        const divString = result['Test Cases'].map((tc) => {
            let paramString = '';
            for (let i = 1; i <= 4; i++){
                if(i !== 1 && tc[`Param${i}`] !== '') {
                    paramString += ', ';
                }

                paramString += tc[`Param${i}`];
            }
            return `<div class="loaded-test-case">(${paramString}) => ${tc.Output}<br /></div>`;
        }).reduce((acc, val) => acc + val, '');

        clearTestCases();
        document.getElementById('test-case-section').insertAdjacentHTML('beforeend', divString);
        doneLoading();
    })
  .catch((err) => {
      doneLoading();
      showMessage('This problem has no test cases.');
  });
};

const chooseQuestion = (elem) => {
    questionSelected = elem.dataset.qId;

    changeHeader();
    getTestCases();
    clearForm();
    removeParameters();
    addParameter(getAvailableParams(elem.dataset.qId));
};

const clearForm = () => {
    const form = document.getElementsByTagName('form');
    if (form[0][2] === undefined) {
        return;
    }
    for (let i = 0; i < 5; i++) {
        form[0][i].value = '';
    }
};


const addParameter = (availableParams) => {
    const paramElem = document.getElementById('parameter-section');
    for (let paramCount = 1; paramCount <= 4; paramCount += 1) {
        let insertDiv = null;
        if (availableParams.includes(paramCount)) {
            insertDiv = `<input type="text" name="Param${paramCount}" placeholder="Param${paramCount}" id="param${paramCount}"></input>`;
        } else {
            insertDiv = `<input type="text" class="disabled" name="Param${paramCount}" placeholder="Param${paramCount}" id="param${paramCount}" disabled></input>`;
        }
        paramElem.insertAdjacentHTML('beforeend', insertDiv);
    }
};

const removeParameters = () => {
    const form = document.getElementsByTagName('form')[0];
    form.removeChild(document.getElementById('parameter-section'));
    document.getElementById('question-header').insertAdjacentHTML('afterend', '<div id="parameter-section"></div>');
};

const makeReturnOptions = () => {
    let divString = '';
    returnTypes.forEach((type) => {
        divString += `<option value=${type}>${type}</option>`;
    });
    return divString;
};

const addQuestionsToBank = function () {
    const questionBank = document.getElementById('question-list');
    questionsLoaded.forEach((question) => {
        const questionText = question.QuestionString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const id = question.id;
        const newDiv = `<div class="question" id="${id}" data-q-id="${id}" onclick="chooseQuestion(this);">${questionText}</div>`;
        questionBank.insertAdjacentHTML('beforeend', newDiv);
    });
    doneLoading();
};

const clearQuestionsBank = () => {
    const deleteList = document.getElementById('question-list').children;
    for(let i = deleteList.length - 1; i>=0; i--){
        deleteList[i].parentNode.removeChild(deleteList[i]);
    }
};

const onDifficultySelect = (event) => {
    difficultySelected = event.target.value;
    onSelect();
};

const onTypeSelect = (event) => {
    typeSelected = event.target.value;
    onSelect();
};

const onSelect = () => {
    const difficulty = difficultySelected === 'All' ? '' : `${difficultySelected}`;
    const type = typeSelected === 'Type' ? '' : `${typeSelected}`;
    const postString = `Difficulty=${difficulty}&Type=${type}`;
    showLoading(document.getElementById('question-bank-view'));
    apiCall('getQuestions.php', postString).then(JSON.parse).then((questions) => {
        if (questions.Questions === null) {
            if (difficultySelected === 'All' && typeSelected !== 'Type') {
                showMessage(`Sorry, there are no ${typeSelected} questions.`);
            } else if (difficultySelected !== 'All' && typeSelected === 'Type') {
                showMessage(`Sorry, there are no ${difficultyOptions[parseInt(difficultySelected) - 1].label} questions.`);
            } else if (difficultySelected !== 'All' && typeSelected !== 'Type') {
                showMessage(`Sorry, there are no ${difficultyOptions[parseInt(difficultySelected) - 1].label} ${typeSelected} questions.`);
            } else {
                showMessage('Sorry, there are no questions :(');
            }
            doneLoading();
            return;
        }
        questionsLoaded = questions.Questions;
        closeMessage();
        clearQuestionsBank();
        addQuestionsToBank();
    });
};
