let quizGenerated = false;
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
        else if(qNum > 100 || qNum <= 0){
            alert('Please enter a number between 1 and 100.')
        }
        else{
            let fetchURL = buildQuizURL(qNum, difficulty, category)
            //console.log(fetchURL);
            clearDB()
            .then((result => {
                console.log(result)
                setTimeout(() => {
                    handleFetch(fetchURL)
                    .then((result2) => {
                        console.log(result2)
                        setTimeout(() => {
                            buildQuiz()
                        }, 1000);
                    })
                }, 2000);
            }))
            
            form.reset();
        }
    });
    

}

function buildQuizURL(qNum, difficulty, category) {
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
    return newUrl;
}

// We will be clearing local db.json because we need to throw away possible old question data
// and fill with new and variable amounts of questions
function clearDB(){

    return new Promise(function(resolve) {
        //let idArr = [];
        fetch(`http://localhost:3000/questions`)
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
                //setTimeout(() => {
                    fetch(`http://localhost:3000/questions/${idArr[i]}`, {
                    method: 'DELETE',
                    headers:
                    {
                        "Content-Type": "application/json",
                        Accept: "application/json"
                    }
                    })
                    .catch(error => console.log("could not resolve: " + error))
                    console.log(`deleted id:${idArr[i]}`)
                //}, 200);
            }
            resolve("Deleted all items");
        })
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
                buildDB(fetchArr);  
                resolve("generated db")
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
        this.correctAnswer = correctAnswer;
        this.selectedAnswer = '';
    }
    
}

/* example fetch request question object
   we will take this data and convert it to an object that is ready for our code
      "type": "multiple",
      "difficulty": "hard",
      "category": "History",
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
function buildDB(fetchArr){
    for(let i = 0; i < fetchArr.length; i++){
        let q = buildQuestion(fetchArr[i]);
        //console.log(q);
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
            "correct_answer": q.correctAnswer,
            "selected_answer": q.selectedAnswer
            })  
        })
    }
    //return qArr;
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

// We will be creating a local array that will hold all the question data
// This function will only be pulling data from the db and not changing
// If needed, can add to this function to by transferring data back and forth,
// such as saving the selected answer and/or if it was correctly selected
function buildQuiz(){
    fetch(`http://localhost:3000/questions`)
    .then(res => res.json())
    .then(data => {
        return new Promise(function(resolve) {
            let qArr = [];
            for(let i = 0; i < data.length; i++)
            {
                qArr.push(data[i]);
            }
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
        //let quizDiv = document.getElementById('quiz-container');
        console.log("question arr when building:")
        console.log(qArr)
        for(let j = 0; j < qArr.length; j++){
            //buildQuestionDiv(qArr[j], j)
            console.log("each question:")
            console.log(qArr[j])

            quizContainer.appendChild(buildQuestionDiv(qArr[j], j));
        }
    })
    //console.log(quizDiv)
}

// this function will handle building our question object into an html element
// 
function buildQuestionDiv(q, index){
    let qDiv = document.createElement('div');
    qDiv.classList.add('question-container');
    let qH4 = document.createElement('h4');
    let diffH4 = document.createElement('h3');
    let catH4 = document.createElement('h3');
    let questionText = document.createElement('h3');
    qH4.textContent = `Question ${index+1}:`;
    diffH4.textContent = `Difficulty: ${q.difficulty}`;
    catH4.textContent = q.category;
    questionText.textContent = q.question;

    qDiv.appendChild(qH4);
    qDiv.appendChild(diffH4);
    qDiv.appendChild(catH4);
    qDiv.appendChild(questionText);
    //qDiv.appendChild(document.createElement('br'));
    let boxArr = [];
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
        ansText.textContent = q.answers[i];

        ansDiv.appendChild(checkDiv);
        ansDiv.appendChild(ansText);

        qDiv.appendChild(ansDiv);
        boxArr.push(checkbox);
        checkboxListener(boxArr);
    }
    console.log(qDiv);
    return qDiv;
}

// using array forEach function to add event listener per checkbox
// will ensure 
function checkboxListener(boxArr){
    boxArr.forEach(box => {
        box.addEventListener('change', (e) =>{
            console.log(e.target.checked);
                boxArr.forEach(element => {
                    element.checked = false;
                })
                box.checked = true
            
        })
    });
}

document.addEventListener("DOMContentLoaded", init);