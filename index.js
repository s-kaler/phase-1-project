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
            buildDB(fetchURL);
            form.reset();
        }
    });
    

}

function buildQuizURL(qNum, difficulty, category) {
    // if the API is rate limited, it will throw a response code of 5
    // if not and the quiz is generated, then "response_code" will be 0
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

function buildDB(fetchURL){

}

/*
const questionObj(){

}
*/


document.addEventListener("DOMContentLoaded", init);