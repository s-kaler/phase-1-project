//warning: do not use --watch when running json-server db.json

let quizGenerated = false;
//we will be generating a quiz with this link and modifiers attached
let dbURL = "https://opentdb.com/api.php?";

const init = () => {
    let form = document.querySelector('#generate-form');
    let generateButton = document.querySelector('#generate-button')
    let qArr = [];
    let quizCreated = false;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let qNum = e.target["q-num"].value;
        let difficulty = e.target.difficulty.value;
        let category = e.target["trivia-category"].value;
        //the field for number of questions cannot be left blank
        if(qNum === '' || isNaN(qNum)){
            alert('Please enter a number.')
        }
        else if(qNum > 100 || qNum <= 0){
            alert('Please enter a number between 1 and 100.')
        }
        else{
            //generateButton.disabled = true;
            //let fetchURL = buildURL(qNum, difficulty, category)
            quizCreated = true;
            clearDB()
            .then(() => buildURL(qNum, difficulty, category))
            .then(fetchURL => handleFetch(fetchURL))
            .then(qArr => buildDB(qArr))
            .then(() => buildQuiz(quizCreated))
            .then((res) => handleQuiz(res[0], res[1]))
            
            form.reset();
            return false;
        }
    });
    // used for example boxes only
    //console.log(boxArr);
    //checkboxListener(boxArr);

}

function buildURL(qNum, difficulty, category) {
    return new Promise(resolve => {
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
        resolve(newUrl);
    })
    
}

// We will be clearing local db.json because we need to throw away possible old question data
// and fill with new and variable amounts of questions
function clearDB(){
    return new Promise(function(resolve) {
        //let idArr = [];
        fetch(`http://localhost:3000/questions/`)
        .then(res => res.json())
        .then(data => {
            return new Promise(function(resolve) {
                // Building an array of ids currently stored in the local db.json server
                // these are ids that will be set to delete so that we can build add new questions
                //console.log(data.length); 
                let newArr = []
                for(let i = 0; i < data.length; i++)
                {
                    newArr.push(data[i].id);
                }
                resolve(newArr)
            })
        })
        .then(idArr => {
            //console.log(idArr);
            for(let i = 0; i < idArr.length; i++){
                //console.log('deleted');
                //console.log(data[i].id)
                
                    fetch(`http://localhost:3000/questions/${idArr[i]}`, {
                    method: 'DELETE',
                    headers:
                    {
                        "Content-Type": "application/json",
                        Accept: "application/json"
                    }
                    })
                    .catch(error => console.log("could not resolve: " + error))
                    //console.log(`deleted id:${idArr[i]}`)
                
            }
            resolve("Deleted all items");
        })
        //.catch(error => {alert("Local db.json server not running")})
    })
    
}

function handleFetch(fetchURL){
    return new Promise(function(resolve) {
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
                resolve(qArr);
            }
        })
        
    })
}

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

/* example fetch request question object
   we will take this data and convert it to an object that is ready for our code
      "type": "multiple",
      "difficulty": "hard",
      "category": "History",p
      "question": "When did the French Revolution begin?",
      "correct_answer": "1789",
      "incorrect_answers": [
        "1823",
        "1756",
        "1799"
      ]
    }
*/
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

// Building the local db with data gained from website API in a different format
// so that we can use it locally in our own db.json and not make extra calls
function buildDB(qArr){
    return new Promise (resolve => {
        //console.log('POST fetchArr:')
        //console.log(qArr)
        promArr = [];
        qArr.forEach((q) => {
            //console.log(q);
            promArr.push(postQ(q))
    })
    Promise.all(promArr).then(res => resolve())
    })

}

function postQ(q){
    return new Promise(resolve => {
        fetch(`http://localhost:3000/questions/`, {
            method: 'POST',
            headers:
            {
            "Content-Type": "application/json",
            Accept: "application/json"
            },
            body: JSON.stringify({
            "category": q.category,
            "difficulty": q.difficulty,
            "question": q.question,
            "answers": q.answers,
            "correct_answer": q['correct_answer'],
            "selected_answer": q['selected_answer']
            })
        })
        .then(res => res.json())
        .then(data => {
            resolve(q)
        })

    })
}

// Building a question object that will be used to store onto our local db
function buildQuestion(q) {
    let answerArr = [];
    answerArr.push(q['correct_answer']);
    for(let i = 0; i < 3; i++){
        answerArr.push(q['incorrect_answers'][i]);
    }
    answerArr = shuffle(answerArr);
    let newQ = new questionObj(q.category, q.difficulty, q.question, answerArr, q['correct_answer'])
    return newQ;
}

// Fixes any special characters saved in db.json format
function stringFixer(string){
    return string.replace(/&quot;/g, '\"').replace(/&amp;/g, '&').replace(/&#039;/g, "\'").replace(/&atilde;/, 'ã')
}

// this function will handle building our question object into an html element
// 
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
    for(let i = 0; i < q.answers.length; i++){
        let ansDiv = document.createElement('div');
        ansDiv.classList.add('answer-container');

        let checkDiv = document.createElement('div');
        checkDiv.classList.add('check-box');
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        //checkbox.value = 'Value1';
        checkDiv.appendChild(checkbox);

        let ansText = document.createElement('div');
        ansText.classList.add('answer-text');
        ansText.textContent = stringFixer(q.answers[i]);

        ansDiv.appendChild(checkDiv);
        ansDiv.appendChild(ansText);

        qDiv.appendChild(ansDiv);
        // adding each answer container, including checkbox and text to array
        ansArr.push(ansDiv)
    }
   
    for(let i = 0; i < ansArr.length; i++){
        if(generating){
            //will add a listener to newly formed questions
            selectListener(ansArr[i], q)
        }
        else{
            //will add styling to already answered questions
            questionResults(ansArr[i], q)
        }
        
    }
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
        //console.log(e.target.checked); 
        boxes.forEach(element => {
            if(element !== box){
                element.checked = false;
                element.style['background-color'] = "white";
            }
        })
        answers.forEach(element => {
            if(element !== box){
                element.checked = false;
                element.style['background-color'] = "white";
            }
        })
        if(box.checked === true){
            ansText.style['background-color'] = "lightgreen";
            q['selected_answer'] = ansText.textContent;
            //console.log(q['selected_answer']);
        }
        else{
            ansText.style['background-color'] = "white";
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
    ansDiv.addEventListener('click', (e) => {
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
    for(let i = 0; i < answers.length; i++) {
        if(answers[i].textContent === stringFixer(q['correct_answer'])){
            answers[i].style['background-color'] = "lightgreen";
        }
        if(answers[i].textContent === selected){
            if(correct){
                answers[i].style['background-color'] = "lightgreen";
            }
            else{
                answers[i].style['background-color'] = "red";
            }
            boxes[i].checked = true;
        }
        else{
            boxes[i].checked = false;
        }
        boxes[i].disabled = true;
    }
}

// We will be creating a local array that will hold all the question data
// This function will only be pulling data from the db and not changing
// If needed, can add to this function to by transferring data back and forth,
// such as saving the selected answer and/or if it was correctly selected
function buildQuiz(quizCreated){
    
    return new Promise(resolve => {
        fetch(`http://localhost:3000/questions`)
        .then(res => res.json())
        .then(data => {
            //console.log(data)
            return new Promise(function(resolve) {
                let qArr = [];
                for(let i = 0; i < data.length; i++)
                {
                    qArr.push(data[i]);
                }
                //console.log(qArr)
                resolve(qArr)
            })
        })
        .then(qArr => {
            let quizContainer = document.getElementById("quiz-container");
            //building new html block for each question
            /*
                Question: 1
                Difficulty: Easy
                Category: Sports
                [ ] Example Answer 1
                [✓] Example Answer 2
                [ ] Example Answer 3
                [ ] Example Answer 4
                [Previous]      [Next]
            */
            if(quizCreated){
                quizContainer.innerHTML = '';
            }
            //console.log("question arr when building:")
            //console.log(qArr)
            //let qObjArr = []
            for(let j = 0; j < qArr.length; j++){
                //buildQuestionDiv(qArr[j], j)
                //console.log("each question:")
                //console.log(qArr[j])
                quizContainer.appendChild(buildQuestionDiv(qArr[j], j, true));
            }

            let quizForm = document.createElement('form');
            quizForm.id = 'submit-quiz'
            let submitButton = document.createElement('input');
            submitButton.type = 'submit';
            submitButton.id = 'submit-button'
            submitButton.value = 'Submit'
            quizForm.appendChild(submitButton)
            quizContainer.appendChild(quizForm)
            
            //return promise with array of question objects and the quiz container HTML element
            resolve([qArr, quizContainer])
        })
    })
    //console.log(quizDiv)
}

// This function will handle the processing of all answered questions
function handleQuiz(qArr, quizContainer){
    //console.log(qArr)
    //console.log(quizContainer)
    let quizForm = quizContainer.querySelector('#submit-quiz')
    let submitButton = quizForm.querySelector('#submit-button')
    let score = 0;
    quizForm.addEventListener('submit', (e) => {
        e.preventDefault()
        submitButton.disabled = true;
        qArr.forEach(q => {
            if(q['selected_answer'] === stringFixer(q['correct_answer'])){
                score++;
            }
        });
        //console.log(`score:${score}`);
        //console.log(quizContainer)
        buildQuiz(qArr, true)
        .then(() =>{
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
            
            for(let j = 0; j < qArr.length; j++){
                quizContainer.appendChild(buildQuestionDiv(qArr[j], j, false));
            }
            //console.log(scoreHeader)
        })
        
    })
}

document.addEventListener("DOMContentLoaded", init);