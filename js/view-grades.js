accessAllowed('s', sessionStorage.Instructor);

let ucid = null;
let examID = null;

const QUESTIONS_VIEW_DIV = 'questions-view';
const EXAM_NAME_DIV = 'exam-name';
const MAIN_GRADE_DIV = 'main-grade';
const SIDEBAR_DIV = 'sidebar';
const CONTAINER_DIV = 'other-half';

const startup = (session) => {
    ucid = session.UCID;
    showLoading(document.getElementById(SIDEBAR_DIV));
    apiCall('getGradedExams.php', `&UCID=${session.UCID}`).then(JSON.parse).then((result) => {
        if ((result['Graded Exams'] === undefined || result['Graded Exams'] === null || result['Graded Exams'].length === 0) && result.success) {
            showMessage('There are no grades yet :(');
            doneLoading();
            return;
        }

        examsLoaded = result['Graded Exams'];
        if (!result['Graded Exams']) {
            showMessage('There are no grades :(');
            return;
        }
        const examsList = result['Graded Exams'].map(exam => `<div data-exam-id=${exam.ExamID} onclick="linkClick(this)" class="sidebar-element">${exam.ExamName}</div>`).reduce((acc, val) => acc + val, '');

        document.getElementById(SIDEBAR_DIV).insertAdjacentHTML('beforeend', examsList);
        doneLoading();
    })
    .catch((err) => {
        doneLoading();
        showMessage('Sorry, something went wrong');
    });
};

const showView = (id) => {
    document.getElementById(id).classList.toggle('show');
};


const getExamIndex = (id) => {
    for (let i = examsLoaded.length - 1; i >= 0; i -= 1) {
        if (examsLoaded[i].ExamID === id) {
            return i;
        }
    }
    return -1;
};

const clearQuestionsView = () => {
    document.getElementById(MAIN_GRADE_DIV).innerText = '';
    const deletingNode = document.getElementById(QUESTIONS_VIEW_DIV);
    if (deletingNode) {
        const parentNode = document.getElementById('exam-view');
        parentNode.removeChild(deletingNode);
        parentNode.insertAdjacentHTML('beforeend', '<div id="questions-view"></div>');
    }
};

const chooseExam = () => {
    clearQuestionsView();

    document.getElementById(SIDEBAR_DIV).classList.add('sidebar-closed');
    document.getElementById(CONTAINER_DIV).classList.add('full-width');
    const questionsView = document.getElementById(QUESTIONS_VIEW_DIV);
    apiCall('getExamGrades.php', `&UCID=${ucid}&ExamID=${examID}`).then(JSON.parse).then((gradesObj) => {
        console.log(gradesObj);
        if (gradesObj.Questions === undefined && gradesObj.success) {
            return;
        }


        gradesObj.Questions.sort((a, b) => a.NumberInExam > b.NumberInExam).forEach((qu) => {
            const testCases = qu.TestCases.map(testCase => `<tr>
                          <td>${testCase.Input}</td><td>${testCase.ExpectedOutput}</td><td>${testCase.Result}</td><td class="${testCase.Passed === '1' ? 'color-pass' : 'color-fail'}">${testCase.Passed === '1' ? 'Yes' : 'No'}</td><td>${parseFloat(testCase.TestCaseGrade).toFixed(2).replace('.00', '')}/${testCase['Max Test Case Grade'].toFixed(2).replace('.00', '')}</td>
                        </tr>`).reduce((acc, val) => acc + val, '');
            const compileResultsSection = qu.compilationMessage !== '' ?
            `<div class="show-result" onclick="showView('Q${qu.QuestionID}-Compile');">Compilation Results</div>
            <div class="hidden compile-result" id="Q${qu.QuestionID}-Compile"></div>` : '';

            const divString = `
            <div class="question-block">
              <div class="question-header">Question ${qu.NumberInExam} (${qu.Grade}/${qu['Max Value']} pts.)</div>
              <div class="question-string" id="Q${qu.QuestionID}-String"></div>
              <div class="show-result-header">Your Answer</div>
              <div class="question-user-input" id="Q${qu.QuestionID}-UserInput"></div>
              ${compileResultsSection}
              <div class="feedback">${qu.userFeedback !== '' ? `Feedback: ${qu.userFeedback}` : ''}</div>
              <div id="Q${qu.QuestionID}TestCases">
                      <table>
                        <tr>
                          <td class="left-align">Correct Method Name</td><td></td><td></td><td class="${qu.correctMethodName === '1' ? 'color-pass' : 'color-fail'}">${qu.correctMethodName === '1' ? 'Yes' : 'No'}</td><td>${parseFloat(qu.methodGrade).toFixed(2).replace('.00', '')}/${parseFloat(qu['Max Method Name Grade']).toFixed(2).replace('.00', '')}</td>
                        </tr>
                        <tr>
                          <td class="left-align">Compiled Correctly</td><td></td><td></td><td class="${qu.compiledCorrectly === '1' ? 'color-pass' : 'color-fail'}">${qu.compiledCorrectly === '1' ? 'Yes' : 'No'}</td><td>${parseFloat(qu.compiledGrade).toFixed(2).replace('.00', '')}/${parseFloat(qu['Max Compiled Grade']).toFixed(2).replace('.00', '')}</td>
                        </tr>
                        <tr>
                          <td class="left-align">Correct Structure</td><td></td><td></td><td class="${qu.correctStructure === '1' ? 'color-pass' : 'color-fail'}">${qu.correctStructure === '1' ? 'Yes' : 'No'}</td><td>${parseFloat(qu.structGrade).toFixed(2).replace('.00', '')}/${parseFloat(qu['Max Struct Grade']).toFixed(2).replace('.00', '')}</td>
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
            questionsView.insertAdjacentHTML('beforeend', divString);

            document.getElementById(`Q${qu.QuestionID}-String`).innerText = qu.QuestionString;
            document.getElementById(`Q${qu.QuestionID}-UserInput`).innerText = qu.UserInput.replace(/(?:\t)/g, '      ');
            if (qu.compilationMessage !== '') {
                document.getElementById(`Q${qu.QuestionID}-Compile`).innerText = qu.compilationMessage;
            }
        });
        document.getElementById(MAIN_GRADE_DIV).innerText = `${gradesObj.Grade.toFixed(2).replace('.00', '')}/${gradesObj['Max Grade']}`;
        doneLoading();
    })
        .catch((err) => {
            doneLoading();
            console.error(err);
            showMessage('Uh Oh! Something went wrong. Please try again later. ');
        });
};

const linkClick = (elem) => {
    if (elem.dataset.examId === examID) {
        return;
    }
    examID = elem.dataset.examId;
    showLoading();
    chooseExam();
};
