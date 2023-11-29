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
            clearDB();
            setTimeout(handleFetch(fetchURL), 1000);
            form.reset();
        }
    });
    

}

// We will be clearing local db.json because we need to throw away possible old question data
// and fill with new and variable amounts of questions
async function clearDB(){
    fetch(`http://localhost:3000/questions`)
    .then(res => res.json())
    .then(data => {
        //console.log(data.length); 
        for(let i = 0; i < data.length; i++){
            //console.log('deleted');
            //console.log(data[i].id)
            fetch(`http://localhost:3000/questions/${data[i].id}`, {
            method: 'DELETE',
            headers:
            {
                "Content-Type": "application/json",
                Accept: "plication/json"
            }
            })
            .catch(error => {console.log(error)})
        }
    })
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

function handleFetch(fetchURL){
    // if the API is rate limited, it will throw a response code of 5
    // if not and the quiz is generated, then "response_code" will be 0
    let qArr = [];
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
    }
  }) 
}

class questionObj {
    constructor(category, difficulty, question, answers, correctAnswer){
        this.category = category;
        this.difficulty = difficulty;
        this.question = question;
        this.answers = answers;
        this.correctAnswer = correctAnswer;
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

function buildDB(fetchArr){
    let qArr = [];
    for(let i = 0; i < fetchArr.length; i++){
        let q = buildQuestion(fetchArr[i]);
        qArr.push(q);
        console.log(q);
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
            "correct_answer": q.correctAnswer
            })  
        })
    }
    
    //return qArr;
}

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

document.addEventListener("DOMContentLoaded", init);