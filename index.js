//we will be generating a quiz with this link and modifiers attached
let dbURL = "https://opentdb.com/api.php?";

const init = () => {
    let form = document.querySelector('#generate-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let qNum = e.target["q-num"].value;
        let difficulty = e.target.difficulty.value;
        let category = e.target["trivia-category"].value;
        //the field for number of questions cannot be left blank
        if(qNum === '' || isNaN(qNum)){
            alert('Please enter a number.')
        }
        else if(qNum > 50 || qNum <= 0){
            alert('Please enter a number between 1 and 50.')
        }
        else{
            handleFetch(buildURL(qNum, difficulty, category));
            form.reset();
        }
    });
}

function buildURL(qNum, difficulty, category) {
    //example db url 
    //https://opentdb.com/api.php?amount=10&category=17&difficulty=easy&type=multiple
    let qNumURL = `amount=${qNum}`;
    let diffURL = '';
    if(difficulty !== 'any'){
        diffURL = `&difficulty=${difficulty}`;
    }
    let catURL = ''
    if(category !== 'any'){
        catURL = `&category=${category}`
    }
    //final db url will include the amount, difficulty, category, and will be multiple choice by default
    //if difficulty or category are not chosen, they will be empty in the url
    //this is what we will use in our fetch
    let newUrl = dbURL + qNumURL + diffURL + catURL + '&type=multiple';
    console.log(newUrl);
    return newUrl;
}

// fetch url from user generated data, creates a array with new question objects
function handleFetch(fetchURL){
    // if the API is rate limited, it will throw a response code of 5
    // if not and the quiz is generated, then "response_code" will be 0
    fetch(fetchURL)
    .then(res => res.json())
    .then(data => {    
        //console.log(data);
        //console.log(data['response_code']);
        if(data['response_code'] === '5'){
            alert('Rate limited, please try again');
        }
        else if(data['response_code'] === 0){
            //console.log(data);
            let fetchArr = data.results;
            let qArr = [];
            fetchArr.forEach(fetched => {
                qArr.push(buildQuestion(fetched))
            })
            buildQuiz(qArr);
        }
    })
}

//class for creating new question object with data we retrieved
class questionObj {
    constructor(category, difficulty, question, answers, correctAnswer){
        this.category = category;
        this.difficulty = difficulty;
        this.question = question;
        this.answers = answers;
        this["correct_answer"] = correctAnswer;
        this["selected_answer"] = '';
    }
    
}

//creating a function to shuffle the answers so they they will be shown in a random order
function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex > 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }  
    return array;
}

// Building a question object that will be used to interpret our fetched data
function buildQuestion(q) {
    let answerArr = [];
    answerArr.push(q['correct_answer']);
    q['incorrect_answers'].forEach(incAns => {
        answerArr.push(incAns)
    })
    answerArr = shuffle(answerArr);
    let newQ = new questionObj(q.category, q.difficulty, q.question, answerArr, q['correct_answer'])
    return newQ;
}

// Fixes any special characters saved in db.json format
function stringFixer(string){
    return string.replace(/&quot;/g, '\"').replace(/&amp;/g, '&').replace(/&#039;/g, "\'").replace(/&atilde;/, 'ã').replace(/&ldquo;/, '“').replace(/&rdquo;/, '”').replace(/&rsquo;/, '’').replace(/&lsquo;/, '‘')
}

// this function will handle building our question object into an html element that will look something like:
/*
    Question: 1
    Difficulty: Easy
    Category: Sports
    [ ] Example Answer 1
    [✓] Example Answer 2
    [ ] Example Answer 3
    [ ] Example Answer 4
*/
function buildQuestionDiv(q, index, generating){
    
    let qDiv = document.createElement('div');
    qDiv.classList.add('question-container');
    let qH4 = document.createElement('h4');
    let diffH3 = document.createElement('h3');
    let catH3 = document.createElement('h3');
    let qText = document.createElement('h3');
    qH4.textContent = `Question ${index+1}:`;
    qH4.classList.add('qHeader')
    diffH3.textContent = `Difficulty: ${stringFixer(q.difficulty)}`;
    catH3.textContent = stringFixer(q.category);
    qText.textContent = stringFixer(q.question);
    qText.classList.add('qText')

    qDiv.appendChild(qH4);
    qDiv.appendChild(diffH3);
    qDiv.appendChild(catH3);
    qDiv.appendChild(qText);
    let ansArr = []
    q.answers.forEach(answer => {
        let ansDiv = document.createElement('div');
        ansDiv.classList.add('answer-container');

        let checkDiv = document.createElement('div');
        checkDiv.classList.add('check-box');
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkDiv.appendChild(checkbox);

        let ansText = document.createElement('div');
        ansText.classList.add('answer-text');
        ansText.textContent = stringFixer(answer);

        ansDiv.appendChild(checkDiv);
        ansDiv.appendChild(ansText);

        qDiv.appendChild(ansDiv);
        // adding each answer container, including checkbox and text to array
        ansArr.push(ansDiv)
    })
    ansArr.forEach(ans => {
        if(generating){
            //will add a listener to newly formed questions
            selectListener(ans, q)
        }
        else{
            //will add styling to already answered questions
            questionResults(ans, q)
        }
    })
    //console.log(qDiv);
    return qDiv;
}

// using array forEach function to add event listener per checkbox
// will ensure other boxes get unchecked when one is checked
function selectListener(ansDiv, q){
    //console.log(ansDiv)
    let box = ansDiv.querySelector('input')
    let ansText = ansDiv.querySelector('.answer-text')
    let boxes = ansDiv.parentNode.querySelectorAll('input')
    let answers = ansDiv.parentNode.querySelectorAll('.answer-text')
    //console.log(boxes)
    //console.log(box.checked)

    // event listener for boxes when they are changed
    box.addEventListener('change', (e) =>{
        if(e.target.checked){
            q['selected_answer'] = ansText.textContent;
            //console.log(q['selected_answer'])
            boxes.forEach(element => {
                if(element !== box){
                    //console.log(element)
                    element.checked = false;
                }
            })
            answers.forEach(element => {
                if(element !== ansText){
                    element.style['background-color'] = "white";
                }
                else{
                    ansText.style['background-color'] = "lightgreen";
                }
            })
        }
        else{
            q['selected_answer'] = ''
            e.target.checked = false;
            //console.log(q['selected_answer'])
            ansText.style['background-color'] = "lightyellow";
        }
    })

    // event listeners for highlighting and selecting answers by clicking on them
    ansDiv.addEventListener('mouseover', (e) =>{
        if(box.checked === false){
            ansText.style['background-color'] = "lightyellow";
        }
    })
    ansDiv.addEventListener('mouseout', (e) => {
        //console.log(box.checked)
        if(box.checked === false){
            ansText.style['background-color'] = "white";
        }
    })
    ansText.addEventListener('click', (e) => {
        boxes.forEach(element => {
            if(element !== box){
                element.checked = false;
            }
        })
        answers.forEach(element => {
            element.style['background-color'] = "white";
        })
        box.checked = true;
        ansText.style['background-color'] = "lightgreen";
        q['selected_answer'] = ansText.textContent;
        //console.log(q['selected_answer']);
    })

}

// will determine styling for results shown after quiz has been submitted
function questionResults(ansDiv, q){
    let boxes = ansDiv.parentNode.querySelectorAll('input')
    let answers = ansDiv.parentNode.querySelectorAll('.answer-text')
    let selected = stringFixer(q['selected_answer'])
    let correct = selected === stringFixer(q['correct_answer'])
    answers.forEach((ans, i) => {
        if(ans.textContent === stringFixer(q['correct_answer'])){
            ans.style['background-color'] = "lightgreen";
        }
        if(ans.textContent === selected){
            if(correct){
                ans.style['background-color'] = "lightgreen";
            }
            else{
                ans.style['background-color'] = "red";
            }
            boxes[i].checked = true;
        }
        else{
            boxes[i].checked = false;
        }
        boxes[i].disabled = true;
    })
}

// the quiz container is populated with each question div object and and a submit button is added to the end
function buildQuiz(qArr){
    let quizContainer = document.getElementById("quiz-container");
    //building new html block for each question
    
    quizContainer.innerHTML = '';
    qArr.forEach((q,i) => {
        quizContainer.appendChild(buildQuestionDiv(q, i, true));
    })
    let quizForm = document.createElement('form');
    quizForm.id = 'submit-quiz'
    let submitButton = document.createElement('input');
    submitButton.type = 'submit';
    submitButton.id = 'submit-button'
    submitButton.value = 'Submit'
    quizForm.appendChild(submitButton)
    quizContainer.appendChild(quizForm)
    handleQuiz(qArr, quizContainer);
    //return promise with array of question objects and the quiz container HTML element
    //console.log(quizDiv)
}

// This function will handle the processing of all submitted answers
function handleQuiz(qArr, quizContainer){
    //console.log(qArr)
    //console.log(quizContainer)
    let quizForm = quizContainer.querySelector('#submit-quiz')
    let submitButton = quizForm.querySelector('#submit-button')
    let score = 0;
    quizForm.addEventListener('submit', (e) => {
        e.preventDefault()
        submitButton.disabled = true;
        //score will be tallied for each answer matching the correct answer
        qArr.forEach(q => {
            if(q['selected_answer'] === stringFixer(q['correct_answer'])){
                score++;
            }
        });
        //console.log(`score:${score}`);
        //console.log(quizContainer)
        
        //building the quiz questions again, but this time they will be displayed with each question answered
        quizContainer.innerHTML = ''
        let scoreHeader = document.createElement('h4');
        scoreHeader.id = 'score';
        scoreHeader.classList.add('score-display')
        scoreHeader.textContent = `Score: ${score}\/${qArr.length}`;
        quizContainer.appendChild(scoreHeader)
        if(score === qArr.length){
            let congrats = document.createElement('h3')
            congrats.textContent = 'Congrats, you got a perfect score!'
            congrats.classList.add('score-display')
            quizContainer.appendChild(congrats)
        }
        
        qArr.forEach((q,i) => {
            quizContainer.appendChild(buildQuestionDiv(q, i, false));
        })
        //console.log(scoreHeader)
    })
}

document.addEventListener("DOMContentLoaded", init);