accessAllowed('i', sessionStorage.Instructor);

let examID = null;
let ucid = null;
let examGrade = null;
let maxGrade = null;
let examName = '';
let studentUCID = null;
let currentExam = null;
let examsLoaded = null;
let takable = null;
let gradesReleased = null;
let testCaseChanges = [];
let questionGradeChanges = [];

const QUESTIONS_VIEW_DIV = 'questions-view';
const EXAM_NAME_DIV = 'exam-name';
const MAIN_GRADE_DIV = 'main-grade';
const SIDEBAR_DIV = 'sidebar';
const CONTAINER_DIV = 'other-half';
const SAVE_BUTTON_DIV = 'save-button';

const startup = (session) => {
    ucid = session.UCID;
    showLoading(document.getElementById(SIDEBAR_DIV));
    apiCall('getExams.php', `&UCID=${session.UCID}`).then(JSON.parse).then((result) => {
        if ((result.Exams === undefined || result.Exams === null
          || result.Exams.length === 0) && result.success) {
            showMessage('There are no grades yet :(');
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


const getGradeIndex = (id) => {
    for (let i = currentExam.length - 1; i >= 0; i -= 1) {
        if (currentExam[i].UCID === id) {
            return i;
        }
    }
    return -1;
};

const onChangeTestCaseGrade = (e) => {
    if (e.target.value < parseFloat(e.target.min)) {
        e.target.value = e.target.min;
    } else if (e.target.value > parseFloat(e.target.max)) {
        e.target.value = e.target.max;
    }

    let changeIndex = null;
    testCaseChanges.filter((change, index) => {
        if (change.ExamID === examID && change.QuestionID === e.target.dataset.questionId
          && change.TestCaseID === e.target.dataset.testCaseId && change.UCID === studentUCID) {
            changeIndex = index;
            return true;
        }
        return false;
    });

    if (testCaseChanges.length === 0) {
        testCaseChanges.push({
            ExamID: examID,
            QuestionID: e.target.dataset.questionId,
            TestCaseID: e.target.dataset.testCaseId,
            UCID: studentUCID,
            OriginalGrade: e.target.dataset.originalGrade,
            NewGrade: e.target.value,
        });
    } else if (changeIndex !== null) {
        testCaseChanges[changeIndex].NewGrade = e.target.value;
    } else {
        testCaseChanges.push({
            ExamID: examID,
            QuestionID: e.target.dataset.questionId,
            TestCaseID: e.target.dataset.testCaseId,
            UCID: studentUCID,
            OriginalGrade: e.target.dataset.originalGrade,
            NewGrade: e.target.value,
        });
    }

    document.getElementById(SAVE_BUTTON_DIV).classList.add('show-button');
};

const onChangePartialGrade = (e) => {
    console.log(e);
    if (e.target.value < parseFloat(e.target.min)) {
        e.target.value = e.target.min;
    } else if (e.target.value > parseFloat(e.target.max)) {
        e.target.value = e.target.max;
    }

    let changeIndex = null;
    questionGradeChanges.filter((change, index) => {
        if (change.ExamID === examID && change.QuestionID === e.target.dataset.questionId
          && change.ColumnName === e.target.dataset.columnName && change.UCID === studentUCID) {
            changeIndex = index;
            return true;
        }
        return false;
    });

    if (questionGradeChanges.length === 0) {
        questionGradeChanges.push({
            ExamID: examID,
            QuestionID: e.target.dataset.questionId,
            UCID: studentUCID,
            ColumnName: e.target.dataset.columnName,
            OriginalGrade: e.target.dataset.originalGrade,
            NewGrade: e.target.value,
        });
    } else if (changeIndex !== null) {
        questionGradeChanges[changeIndex].NewGrade = e.target.value;
    } else {
        questionGradeChanges.push({
            ExamID: examID,
            QuestionID: e.target.dataset.questionId,
            ColumnName: e.target.dataset.columnName,
            UCID: studentUCID,
            OriginalGrade: e.target.dataset.originalGrade,
            NewGrade: e.target.value,
        });
    }

    document.getElementById(SAVE_BUTTON_DIV).classList.add('show-button');
};


const clearQuestionsView = () => {
    // changing student in same exam
    const deletingNode = document.getElementById(QUESTIONS_VIEW_DIV);
    const parentNode = document.getElementById('exam-view');

    if (deletingNode) {
        parentNode.removeChild(deletingNode);
    }
    parentNode.insertAdjacentHTML('beforeend', '<div id="questions-view"></div>');
};

const makeQuestionDiv = (qu) => {
    const testCases = qu.TestCases.map(testCase => `<tr>
                <td>${testCase.Input}</td><td>${testCase.ExpectedOutput}</td><td>${testCase.Result}</td><td class="${testCase.Passed === '1' ? 'color-pass' : 'color-fail'}">${testCase.Passed === '1' ? 'Yes' : 'No'}</td><td><input type="number" value="${parseFloat(testCase.TestCaseGrade).toFixed(2).replace('.00', '')}" data-question-id="${qu.QuestionID}" data-test-case-id="${testCase.TestCaseID}" data-original-grade="${testCase.TestCaseGrade}" onchange="onChangeTestCaseGrade(event);" min="0" max="${testCase['Max Test Case Grade'].toFixed(2).replace('.00', '')}" step=".01"/>/${testCase['Max Test Case Grade'].toFixed(2).replace('.00', '')}</td>
              </tr>`).reduce((acc, val) => acc + val, '');
    const compileResultsSection = qu.compilationMessage !== '' ?
  `<div class="show-result" onclick="showView('Q${qu.QuestionID}-Compile');">Compilation Results</div>
  <div class="hidden compile-result" id="Q${qu.QuestionID}-Compile"></div>` : '';
    const divString = `
          <div class="question-block">
            <div class="question-header">Question ${qu.NumberInExam} (${qu.Grade}/${qu['Max Value']} pts.)</div>
            <div class="question-string" id="Q${qu.QuestionID}-String"></div>
            <div class="show-result-header">${studentUCID}'s Answer</div>
            <div class="question-user-input" id="Q${qu.QuestionID}-UserInput"></div>
            ${compileResultsSection}
            <div class="feedback">${qu.userFeedback !== '' ? `Feedback: ${qu.userFeedback}` : ''}</div>
            <div id="Q${qu.QuestionID}TestCases">
                    <table>
                      <tr>
                        <td class="left-align">Correct Method Name</td><td></td><td></td><td class="${qu.correctMethodName === '1' ? 'color-pass' : 'color-fail'}">${qu.correctMethodName === '1' ? 'Yes' : 'No'}</td><td><input type="number" class="test-case-input" value="${parseFloat(qu.methodGrade).toFixed(2).replace('.00', '')}" data-question-id="${qu.QuestionID}" data-original-grade="${qu.methodGrade}" data-column-name="methodGrade" onchange="onChangePartialGrade(event);" min="0" max="${qu['Max Method Name Grade'].toFixed(2).replace('.00', '')}" step=".01"/>/${qu['Max Method Name Grade']}</td>
                      </tr>
                      <tr>
                        <td class="left-align">Compiled Correctly</td><td></td><td></td><td class="${qu.compiledCorrectly === '1' ? 'color-pass' : 'color-fail'}">${qu.compiledCorrectly === '1' ? 'Yes' : 'No'}</td><td><input type="number" class="test-case-input" value="${parseFloat(qu.compiledGrade).toFixed(2).replace('.00', '')}" data-question-id="${qu.QuestionID}" data-original-grade="${qu.compiledGrade}" data-column-name="compiledGrade" onchange="onChangePartialGrade(event);" min="0" max="${qu['Max Compiled Grade'].toFixed(2).replace('.00', '')}" step=".01"/>/${qu['Max Compiled Grade']}</td>
                      </tr>
                      <tr>
                        <td class="left-align">Correct Structure</td><td></td><td></td><td class="${qu.correctStructure === '1' ? 'color-pass' : 'color-fail'}">${qu.correctStructure === '1' ? 'Yes' : 'No'}</td><td><input type="number" class="test-case-input" value="${parseFloat(qu.structGrade).toFixed(2).replace('.00', '')}" data-question-id="${qu.QuestionID}" data-original-grade="${qu.structGrade}" data-column-name="structGrade" onchange="onChangePartialGrade(event);" min="0" max="${qu['Max Struct Grade'].toFixed(2).replace('.00', '')}" step=".01"/>/${qu['Max Struct Grade']}</td>
                      </tr>
                    <tr class="table-header">
                        <th>Input</th><th>Expected Output</th><th>Actual Output</th><th>Passed</th><th>Points</th>
                    </tr>
                    <tbody>
                        ${testCases}
                    </tbody>
                    </table>
            </div>
          </div>`;
    return divString;
};

const changeStudentGrades = () => {
    clearQuestionsView();
    examGrade = null;
    maxGrade = null;
    const gradesObj = currentExam[getGradeIndex(studentUCID)];
    examGrade = gradesObj.Grade.toFixed(2).replace('.00', '');
    maxGrade = gradesObj['Max Grade'];
    document.getElementById(MAIN_GRADE_DIV).innerText = `${examGrade}/${maxGrade}`;
    const questionsView = document.getElementById(QUESTIONS_VIEW_DIV);

    gradesObj.Questions.sort((a, b) => a.NumberInExam > b.NumberInExam).forEach((qu) => {
        const divString = makeQuestionDiv(qu);
        questionsView.insertAdjacentHTML('beforeend', divString);

        document.getElementById(`Q${qu.QuestionID}-String`).innerText = qu.QuestionString;
        document.getElementById(`Q${qu.QuestionID}-UserInput`).innerText = qu.UserInput.replace(/(?:\t)/g, '      ');
        if (qu.compilationMessage !== '') {
            document.getElementById(`Q${qu.QuestionID}-Compile`).innerText = qu.compilationMessage;
        }
    });
};

const calculateNewGrade = () => {
    let newTotalGrade = 0;
    const newgradesObj = currentExam[getGradeIndex(studentUCID)];
    newgradesObj.Questions = newgradesObj.Questions.map((qu) => {
        const newQuestion = qu;
        let totalTCGrade = 0;

        newQuestion.TestCases = qu.TestCases.map((tc) => {
            const newTC = tc;
            const changes = testCaseChanges.filter(grade => grade.ExamID === examID
              && grade.QuestionID === qu.QuestionID && grade.UCID === studentUCID
              && grade.TestCaseID === tc.TestCaseID);
            if (changes.length !== 0) {
                const netTCGradeChange = (changes[0].NewGrade - changes[0].OriginalGrade);
                newTC.TestCaseGrade = (parseFloat(tc.TestCaseGrade) + netTCGradeChange).toFixed(2).replace('.00', '');
            }
            totalTCGrade += parseFloat(newTC.TestCaseGrade);
            return newTC;
        });
        newQuestion.TestCasesGrade = totalTCGrade.toFixed(2).replace('.00', '');
        let newQuestionGrade = 0;
        const categories = ['compiledGrade', 'methodGrade', 'structGrade'];
        categories.forEach((col) => {
            const changes = questionGradeChanges
            .filter(grade => grade.ExamID === examID && grade.ColumnName === col
               && grade.QuestionID === qu.QuestionID && grade.UCID === studentUCID);
            if (changes.length !== 0) {
                newQuestion[col] = (parseFloat(qu[col]) +
                 (changes[0].NewGrade - changes[0].OriginalGrade)).toFixed(2).replace('.00', '');
            }
            newQuestionGrade += parseFloat(newQuestion[col]);
        });
        newQuestionGrade += parseFloat(newQuestion.TestCasesGrade);
        newQuestion.Grade = newQuestionGrade.toFixed(2).replace('.00', '');
        newTotalGrade += parseFloat(newQuestion.Grade);
        return newQuestion;
    });
    newgradesObj.Grade = newTotalGrade;
    currentExam[getGradeIndex(studentUCID)] = newgradesObj;

    document.getElementById(MAIN_GRADE_DIV).innerText = `${newgradesObj.Grade.toFixed(2).replace('.00', '')}/${maxGrade}`;
    changeStudentGrades();
};

const onStudentSelect = (e) => {
    studentUCID = e.target.value;
    testCaseChanges = [];
    questionGradeChanges = [];
    document.getElementById(SAVE_BUTTON_DIV).classList.remove('show-button');

    changeStudentGrades();
};

const clearExamView = () => {
    // changing exam
    const parentNode = document.getElementById('exam-container').parentNode;
    parentNode.removeChild(document.getElementById('exam-container'));
    parentNode.insertAdjacentHTML('beforeend', `<div id="exam-container">
        <h1 id="exam-name"></h1>
        <div id="release-view"></div>
        <div id="exam-view">
            <div class="center"><select id="select-student" onchange="onStudentSelect(event)"></select><div id="save-button" onclick="onSave();">Save Changes</div></div>
            <div id="main-grade"></div>
            <div id="questions-view"></div>
        </div>
    </div>`);
};

const chooseExam = () => {
    trackedChanges = [];
    showLoading();
    document.getElementById(SIDEBAR_DIV).classList.add('sidebar-closed');
    document.getElementById(CONTAINER_DIV).classList.add('full-width');
    apiCall('getExamGrades.php', `&UCID=${ucid}&ExamID=${examID}`).then(JSON.parse).then((gradesObj) => {
        if (!gradesObj.success) {
            throw 'Error';
        }
        console.log(gradesObj);
        clearExamView();
        currentExam = gradesObj.StudentGrades;

        examName = examsLoaded[getExamIndex(examID)].displayName;
        takable = examsLoaded[getExamIndex(examID)].releasedForTaking === '1';
        gradesReleased = examsLoaded[getExamIndex(examID)].gradesReleased === '1';


        document.getElementById(EXAM_NAME_DIV).innerText = examName;

        const studentsList = currentExam.map(grade => `<option value="${grade.UCID}">${grade.UCID}</option>`).reduce((acc, val) => acc + val, '<option>Select a Student</option>');

        document.getElementById('select-student').insertAdjacentHTML('beforeend', studentsList);
        if (!document.getElementById('release-check')) {
            document.getElementById('release-view').insertAdjacentHTML('beforeend', '<label>Allow students to view their grades</label><input id="release-check" type="checkbox" onchange="releaseGrades()"></input>');
        }
        document.getElementById('release-check').checked = gradesReleased;
        doneLoading();
    })
        .catch((err) => {
            doneLoading();
            console.error(err);
            showMessage('Uh Oh! Something went wrong. Please try again later. ');
        });
};

const releaseGrades = () => {
    closeMessage();
    gradesReleased = !gradesReleased;
    const postString = `&ExamID=${examID}&ReleasedForTaking=${takable ? '1' : '0'}&GradesReleased=${gradesReleased ? '1' : '0'}`;
    apiCall('setExam.php', postString).then(JSON.parse).then((res) => {
        console.log(res);
        if (res.status) {
            showMessage(`Students ${gradesReleased ? 'can' : 'can\'t'} see their grades now.`);
        } else {
            showMessage('Sorry, something went wrong. Try again later');
        }
    })
    .catch((err) => {
        doneLoading();
        showMessage('Sorry, something went wrong');
    });
};

const linkClick = (elem) => {
    examID = elem.dataset.examId;
    chooseExam();
};


const showView = (id) => {
    document.getElementById(id).classList.toggle('show');
};

const onSave = () => {
    if (questionGradeChanges.length === 0 && testCaseChanges.length === 0) {
        closeMessage();
        doneLoading();
        console.log('no changes');
        return;
    }
    closeMessage();
    showLoading();
    const sendingQuestionGradeChanges = questionGradeChanges.map((changedGrade) => {
        const postString = `&Column=${changedGrade.ColumnName}&ExamID=${changedGrade.ExamID}&UCID=${changedGrade.UCID}&QuestionID=${changedGrade.QuestionID}&NewGrade=${encodeURI(changedGrade.NewGrade)}`;
        return apiCall('updateGrade.php', postString);
    });

    const sendingTestCaseChanges = testCaseChanges.map((tc) => {
        const postString = `&Table=TestCasesGrades490&ExamID=${tc.ExamID}&UCID=${tc.UCID}&QuestionID=${tc.QuestionID}&TestCaseID=${tc.TestCaseID}&NewGrade=${encodeURI(tc.NewGrade)}`;
        return apiCall('updateGrade.php', postString);
    });

    Promise.all(sendingTestCaseChanges.concat(sendingQuestionGradeChanges)).then((res) => {
        const parsedResults = res.map(JSON.parse);
        const errorsFound = [];
        parsedResults.forEach((individualResult, index) => {
            if (!individualResult.status || !individualResult.success) {
                errorsFound.push(index);
            }
        });
        if (errorsFound.length === 0) {
            showMessage('Your changes were submitted successfully');
            calculateNewGrade();
            questionGradeChanges = [];
            testCaseChanges = [];
            doneLoading();
        } else {
            showMessage('There was a problem submitting some of your changes. Please try again later.');
            doneLoading();
        }


        document.getElementById(SAVE_BUTTON_DIV).classList.remove('show-button');
    })
    .catch((err) => {
        console.error(err);
        doneLoading();
        showMessage('Uh Oh! There was a problem submitting your changes. Please try again later. ');
    });
};
