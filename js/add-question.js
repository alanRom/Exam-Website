accessAllowed('i', sessionStorage.Instructor);

const paramCount = 1;
let typeSelected = 'Type';
let difficultySelected = 'All';
const questionsSelected = [];
const returnTypes = [
    'int',
    'String',
    'float',
    'double',
    'boolean',
    'char',
    'void'
];
const problemTypes = ['None', 'For', 'While', 'Recursion', 'Overload'];
const difficultyOptions = [
    {
        val: 1,
        label: 'Easy'
    }, {
        val: 2,
        label: 'Medium'
    }, {
        val: 3,
        label: 'Hard'
    }
];

const startup = (session) => {
    showLoading(document.getElementById('question-bank-view'));
    makeDifficultyOptions();
    addParameter();
    addSelectOptions();
    makeTypeFilterOptions();
    makeDifficultyFilterOptions();

    apiCall('getQuestions.php').then(JSON.parse).then((questions) => {
        addQuestionsToView(questions.Questions);
    });
};

const addParameter = () => {
    const parameterSection = document.getElementById('parameter-section');
    for (let paramCount = 1; paramCount <= 4; paramCount++) {
        const insertDiv = `<select name="Param${paramCount}_Type" id="param${paramCount}_Type" onchange="unlockParameters('${paramCount}');" ${paramCount !== 1
            ? 'disabled': ''}><option value="" selected>Parameter${paramCount} Type</option>
      ${makeReturnOptions()}
    </select>,`;
        parameterSection.insertAdjacentHTML('beforeend', insertDiv);
    }
};

const validation = () => {
    const requiredFields = ['MethodName', 'Difficulty', 'Type', 'ReturnType', 'QuestionString'];
    let accepted = true;
    requiredFields.forEach((field) => {
        const div = document.getElementsByName(field)[0];
        if (div.value === '') {
            div.classList.add('reject');
            //div.insertAdjacentHTML('afterend','<div class="reject">Required</div>')
            accepted = false;
        } else {
            div.classList.remove('reject');
        }
    });
    return accepted;
};

const clearFields = () => {
    const fields = [
        'MethodName',
        'Difficulty',
        'Type',
        'ReturnType',
        'Param1_Type',
        'Param2_Type',
        'Param3_Type',
        'Param4_Type',
        'QuestionString'
    ];
    fields.forEach((field) => {
        document.getElementsByName(field)[0].value = '';
    });
};

const addQuestionsToView = function(questions) {
    const questionBank = document.getElementById('question-list');
    clearQuestionsBank();

    questions.forEach((question) => {
        const newDiv = document.createElement('div');
        newDiv.innerText = question.QuestionString;
        newDiv.className = 'question';
        questionBank.appendChild(newDiv);
    });
    
    doneLoading();
};

const clearQuestionsBank = () => {
    const deleteList = document.getElementById('question-list').children;
    for(let i = deleteList.length - 1; i>=0; i--){
        deleteList[i].parentNode.removeChild(deleteList[i]);
    }
};

const makeProblemOptions = () => {
    let divString = '';
    problemTypes.forEach((problem) => {
        divString += `<option value=${problem}>${problem}</option>`;
    });
    return divString;
};

const makeReturnOptions = () => {
    let divString = '';
    returnTypes.forEach((type) => {
        divString += `<option value=${type}>${type}</option>`;
    });
    return divString;
};

const addSelectOptions = () => {
    const problemDropdown = document.getElementById('problem-type');
    const returnDropdown = document.getElementById('return-type');

    const problemOptions = makeProblemOptions();
    const returnOptions = makeReturnOptions();

    problemDropdown.insertAdjacentHTML('beforeend', problemOptions);
    returnDropdown.insertAdjacentHTML('beforeend', returnOptions);


};
const unlockParameters = (index) => {
    if (index === '4')
        return;
    document.getElementById(`param${parseInt(index) + 1}_Type`).disabled = false; //unlock next parameter
};

const makeDifficultyOptions = () => {
    const difficultyDropdown = document.getElementById('difficulty-type');
    let divString = '';
    difficultyOptions.forEach((type) => {
        divString += `<option value=${type.val}>${type.label}</option>`;
    });
    difficultyDropdown.insertAdjacentHTML('beforeend', divString);
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
    const difficulty = difficultySelected === 'All'
        ? ''
        : `${difficultySelected}`;
    const type = typeSelected === 'Type'
        ? ''
        : `${typeSelected}`;
    const postString = `Difficulty=${difficulty}&Type=${type}`;
    showLoading(document.getElementById('question-bank-view'));
    apiCall('getQuestions.php', postString).then(JSON.parse).then((questions) => {
        if (questions.Questions === null) {
            if (difficultySelected === 'All' && typeSelected !== 'Type') {
                showMessage(`Sorry, there are no ${typeSelected} questions.`);
            } else if (difficultySelected !== 'All' && typeSelected === 'Type') {
                showMessage(`Sorry, there are no ${difficultyOptions[parseInt(difficultySelected) - 1].label} questions.`);
            } else {
                showMessage(`Sorry, there are no ${difficultyOptions[parseInt(difficultySelected) - 1].label} ${typeSelected} questions.`);

            }
            doneLoading();
            return;
        }

        closeMessage();
        addQuestionsToView(questions.Questions);

    });
};

const onSubmit = (e) => {
    e.preventDefault();

    const fields = [
        'MethodName',
        'Difficulty',
        'Type',
        'ReturnType',
        'Param1_Type',
        'Param2_Type',
        'Param3_Type',
        'Param4_Type'
    ];

    if (!validation()) {
        showMessage('Sorry, but not all the fields were filled out');
        return;
    } else {
        closeMessage();
    }

    const vowels = [
        'a',
        'e',
        'i',
        'o',
        'u',
        'A',
        'E',
        'I',
        'O',
        'U'
    ];

    const returnVal = document.getElementsByName('ReturnType')[0].value;
    const returnString = vowels.includes(returnVal.charAt(0))
        ? `an ${returnVal}`
        : `a ${returnVal}`;

    let params = new Array();
    params[0] = document.getElementsByName('Param1_Type')[0].value;
    params[1] = document.getElementsByName('Param2_Type')[0].value;
    params[2] = document.getElementsByName('Param3_Type')[0].value;
    params[3] = document.getElementsByName('Param4_Type')[0].value;
    paramCount;

    params = params.filter((param) => {
        return param !== '';
    });

    let paramString = '';
    if (params.length > 1) {
        paramString = 'as parameters ';

    } else {
        paramString = 'as a parameter ';
    }

    if (params.length === 1) {
        paramString += vowels.includes(params[0].charAt(0))
            ? `an ${params[0]}`
            : `a ${params[0]}`;
    } else if (params.length === 2) {
        const param1 = vowels.includes(params[0].charAt(0))
            ? `an ${params[0]}`
            : `a ${params[0]}`;
        const param2 = vowels.includes(params[1].charAt(0))
            ? `an ${params[1]}`
            : `a ${params[1]}`;
        paramString += `${param1} and ${param2}`;
    } else if (params.length > 2) {
        params.forEach((param, index) => {
            if (index === params.length - 1) {
                const lastParam = vowels.includes(param.charAt(0))
                    ? `an ${param}`
                    : `a ${param}`;
                paramString += `and ${lastParam}`;

            } else {
                paramString += vowels.includes(param.charAt(0))
                    ? `an ${param}, `
                    : `a ${param}, `;
            }
        });
    }

    const problemType = document.getElementsByName('Type')[0].value === 'None'
        ? ''
        : `uses ${document.getElementsByName('Type')[0].value} and `;

    const questionString = `Write a method named ${document.getElementsByName('MethodName')[0].value} that ${problemType}returns ${returnString}. The function takes in ${paramString} and should do the following: ${document.getElementsByName('QuestionString')[0].value}`;

    let postString = fields.map((field) => {
        return `${field}=${encodeURIComponent(document.getElementsByName(field)[0].value)}&`;
    }).reduce((acc, val) => {
        return acc + val;
    }, '&');
    postString += 'QuestionString=' + encodeURIComponent(questionString);
    apiCall('addQuestion.php',postString).then(JSON.parse).then(res => {
        if(res.success){
            clearFields();
            showMessage('Your question was created successfully. You should add some test cases now.');
        }
        else{
            showMessage('Sorry, there was an problem creating the question. Try again later.');
        }
    });
};
