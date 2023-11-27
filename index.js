const init = () => {
    let quizGenerated = false;
    let dbURL = ""
    let form = document.querySelector('#generate-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let qNum = e.target["q-num"].value;
        let difficulty = e.target.difficulty.value;
        let category = e.target["trivia-category"].value;
        if(qNum === ''){
            alert('Please enter a number')
        }
        else{
            buildQuiz(qNum, difficulty, category)
            form.reset();
        }
    });
}

function buildQuiz(qNum, difficulty, category) {
   
}




document.addEventListener("DOMContentLoaded", init);