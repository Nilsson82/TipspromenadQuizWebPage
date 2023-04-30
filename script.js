document.addEventListener("DOMContentLoaded", function() {

  const listQuizdata = [
    {
      listName: "Världsfrågor",
      answerDisplay: "vertically",
      answerOptions: true,
      questionKnockout: { 
        question: "Vad är svaret på den ultimata frågan om livet, universum och allt?",
        result: 42
      },
      QuestionList : [
        {    
          question: "Vilken är den högsta berget i världen?",    
          answers: ["K2", "Kilimanjaro", "Mount Everest"],
          correctAnswer: "Mount Everest",
          image: "https://images.pexels.com/photos/15964349/pexels-photo-15964349.jpeg"
        },
        {
          question: "Vilken är världens största sjö?",
          answers: ["Kaspiska havet", "Svarta havet", "Östersjön", "Döda havet"],
          correctAnswer: "Kaspiska havet"
        },
        {
          question: "Vilken är världens längsta flod?",
          answers: ["Amazonas", "Mississippi", "Nilen", "Gula floden"],
          correctAnswer: "Nilen"
        },
        {
          question: "Vilken är världens största ö?",
          answers: ["Madagaskar", "Grönland", "Borneo", "Australien"],
          correctAnswer: "Grönland"
        },
        {
          question: "Vilken är världens största öken?",
          answers: ["Sahara", "Gobi", "Atacama", "Arktis"],
          correctAnswer: "Sahara"
        },
        {
          question: "Vad är världens största land till ytan?",
          answers: ["Kanada", "Kina", "Ryssland", "USA"],
          correctAnswer: "Ryssland"
        },
        {
          question: "Vad är världens högsta vattenfall?",
          answers: ["Niagara Falls", "Victoria Falls", "Iguazu Falls", "Angel Falls"],
          correctAnswer: "Angel Falls"
        },
        {
          question: "Vad är världens största land till befolkning?",
          answers: ["Indien", "Kina", "USA", "Indonesien"],
          correctAnswer: "Kina"
        },
        {
          question: "Vad är världens största ocean?",
          answers: ["Atlanten", "Indiska oceanen", "Södra oceanen", "Stilla havet"],
          correctAnswer: "Stilla havet"
        },
        {
          question: "Vilket år startade andra världskriget?",
          answers: ["1939", "1941", "1943", "1945"],
          correctAnswer: "1939"
        },
        {
          question: "Vem skrev boken \"Mio min Mio\"?",
          answers: ["Roald Dahl", "Tove Jansson", "Astrid Lindgren", "Michael Ende"],
          correctAnswer: "Astrid Lindgren"
        },
        {
          question: "Vem vann fotbolls-VM 2018?",
          answers: ["Kroatien", "Frankrike", "Belgien", "England"],
          correctAnswer: "Frankrike"
        }
      ]
    },
    {
      listName: "Vuxenfrågor till tipspromenad", // A custom name for the question list that will be displayed on the question list button
      answerDisplay: "horizontally", // Determines the layout of the answer alternatives; set to "horizontally" for a side-by-side layout or "vertically" for a top-to-bottom layout
      answerOptions: false, // If true, adds an index (1, 2, 3, etc.) in front of each answer alternative; if false, answer alternatives will be displayed without an index
      questionKnockout: { 
        result: 42
      },
      QuestionList : [
      {    
        question: "Fråga 1",    
        answers: ["1", "X", "2"],
        correctAnswer: "1",
      },
      {    
        question: "Fråga 2",    
        answers: ["1", "X", "2"],
        correctAnswer: "X",
      },
      {    
        question: "Fråga 3",    
        answers: ["1", "X", "2"],
        correctAnswer: "2",
      },
      {    
        question: "Fråga 4",    
        answers: ["1", "X", "2"],
        correctAnswer: "2",
      },
      {    
        question: "Fråga 5",    
        answers: ["1", "X", "2"],
        correctAnswer: "1",
      },
      {    
        question: "Fråga 6",    
        answers: ["1", "X", "2"],
        correctAnswer: "X",
      },
      {    
        question: "Fråga 7",    
        answers: ["1", "X", "2"],
        correctAnswer: "X",
      },
      {    
        question: "Fråga 8",    
        answers: ["1", "X", "2"],
        correctAnswer: "2",
      },
      {    
        question: "Fråga 9",    
        answers: ["1", "X", "2"],
        correctAnswer: "1",
      },
      {    
        question: "Fråga 10",    
        answers: ["1", "X", "2"],
        correctAnswer: "X",
      },
      {    
        question: "Fråga 11",    
        answers: ["1", "X", "2"],
        correctAnswer: "2",
      },
      {    
        question: "Fråga 12",    
        answers: ["1", "X", "2"],
        correctAnswer: "1",
      }
    ]
  },
  {
    listName: "Barnfrågor till tipspromenad", // A custom name for the question list that will be displayed on the question list button
    answerDisplay: "horizontally", // Determines the layout of the answer alternatives; set to "horizontally" for a side-by-side layout or "vertically" for a top-to-bottom layout
    answerOptions: false, // If true, adds an index (1, 2, 3, etc.) in front of each answer alternative; if false, answer alternatives will be displayed without an index
    questionKnockout: { 
      result: 42
    },
    QuestionList : [
      {    
        question: "Fråga 1",    
        answers: ["1", "X", "2"],
        correctAnswer: "1",
      },
      {    
        question: "Fråga 2",    
        answers: ["1", "X", "2"],
        correctAnswer: "X",
      },
      {    
        question: "Fråga 3",    
        answers: ["1", "X", "2"],
        correctAnswer: "2",
      },
      {    
        question: "Fråga 4",    
        answers: ["1", "X", "2"],
        correctAnswer: "2",
      },
      {    
        question: "Fråga 5",    
        answers: ["1", "X", "2"],
        correctAnswer: "1",
      },
      {    
        question: "Fråga 6",    
        answers: ["1", "X", "2"],
        correctAnswer: "X",
      },
      {    
        question: "Fråga 7",    
        answers: ["1", "X", "2"],
        correctAnswer: "X",
      },
      {    
        question: "Fråga 8",    
        answers: ["1", "X", "2"],
        correctAnswer: "2",
      },
      {    
        question: "Fråga 9",    
        answers: ["1", "X", "2"],
        correctAnswer: "1",
      },
      {    
        question: "Fråga 10",    
        answers: ["1", "X", "2"],
        correctAnswer: "X",
      },
      {    
        question: "Fråga 11",    
        answers: ["1", "X", "2"],
        correctAnswer: "2",
      },
      {    
        question: "Fråga 12",    
        answers: ["1", "X", "2"],
        correctAnswer: "1",
      }
    ]
  },
];

let currentQuizData = listQuizdata[0].QuestionList; // set quizData as the default
let currentListData = listQuizdata.find(list => list.QuestionList === currentQuizData);

const quizContainer = document.getElementById("quiz");
const submitButton = document.getElementById("submitBtn");
//const resultsContainer = document.getElementById("results");
const resultsContainer = document.getElementById("resultsContainer");
const knockoutResult = document.getElementById("knockoutResult");

// Add event listener for the "Meny" button
const menyBtn = document.getElementById("menyBtn");
const questionListModal = document.getElementById("questionListModal");
const closeModal = document.getElementsByClassName("close")[0];

menyBtn.addEventListener("click", () => {
  const knockoutAnswerInput = document.getElementById("knockout-answer");

  // Clear the content of on webpage
  knockoutAnswerInput.disabled = false;
  knockoutAnswerInput.value = "";
  resultsContainer.innerHTML = "";
  knockoutResult.innerHTML = "";
  
  questionListModal.style.display = "block";
});

closeModal.addEventListener("click", () => {
  questionListModal.style.display = "none";
});

// Add event listeners for the question list buttons
const questionListContainer = document.getElementById("questionListContainer");

listQuizdata.forEach((quizData, index) => {
  const button = document.createElement("button");
  button.textContent = quizData.listName;
  button.classList.add("question-list-button");
  
  button.addEventListener("click", () => {
    currentQuizData = quizData.QuestionList;
    displayQuiz(quizData.answerOptions, quizData.answerDisplay);
    questionListModal.style.display = "none";
  });

  // Append the button to the questionListContainer
  questionListContainer.appendChild(button);
});

function displayQuiz(answerOptions, answerDisplay) {
  const output = [];
  currentListData = listQuizdata.find(list => list.QuestionList === currentQuizData);
  
  document.getElementById("listName").textContent = currentListData.listName;

  // Update the knockoutQuestionText
  if (currentListData.questionKnockout) {
    const knockoutQuestionText = document.getElementById("knockout-question-text");
    knockoutQuestionText.textContent = currentListData.questionKnockout.question;
  }

  currentQuizData.forEach((currentQuestion, questionNumber) => {
    const answers = [];

    currentQuestion.answers.forEach((answer, answerIndex) => {
      answers.push(
        `<label>
          <input type="radio" name="question${questionNumber}" value="${answerIndex}">
          ${answerOptions ? `${answerIndex}: ` : ""}${answer}
        </label>`
      );
    });

    const imageHtml = currentQuestion.image
      ? `<img src="${currentQuestion.image}" alt="${currentQuestion.question}" class="question-image">`
      : "";

    output.push(
      `<div class="question"> ${currentQuestion.question}</div>
       ${imageHtml}
      <div class="answers ${answerDisplay === 'horizontally' ? 'horizontal-display' : 'vertical-display'}"> ${answers.join("")} </div>`
    );
  });

  quizContainer.innerHTML = output.join("");
}

function showResults() {
  const answerContainers = quizContainer.querySelectorAll(".answers");
  let numCorrect = 0;

  currentQuizData.forEach((currentQuestion, questionNumber) => {
    const answerContainer = answerContainers[questionNumber];
    const selector = `input[name=question${questionNumber}]:checked`;
    const userAnswer = (answerContainer.querySelector(selector) || {}).value;

    const correctAnswerIndex = currentQuestion.answers.indexOf(currentQuestion.correctAnswer);

    if (userAnswer == correctAnswerIndex) {
      numCorrect++;

      // Mark the correct answer green
      answerContainers[questionNumber].style.color = 'green';
    } else {
      // Mark the wrong answer red
      answerContainers[questionNumber].style.color = 'red';
    }

    // Add the following lines of code to disable the input elements
    const radioButtons = document.querySelectorAll("input[type='radio']");
    radioButtons.forEach((radio) => {
      radio.disabled = true;
    });

    const knockoutAnswerInput = document.getElementById("knockout-answer");
    knockoutAnswerInput.disabled = true;
  });

  const language = navigator.language || navigator.userLanguage;
  if (language.startsWith("sv")) {
    resultsContainer.innerHTML =`<span class="result">Du har besvarat ${numCorrect} av ${currentQuizData.length} frågor korrekt!</span>`;
  } else {
    resultsContainer.innerHTML = `<span class="result">You got ${numCorrect} out of ${currentQuizData.length} correct!</span>`;
  }

  // Display the knockout result
  const knockoutAnswer = document.getElementById("knockout-answer").value;
  const knockoutResult = document.getElementById("knockoutResult");
  const correctKnockoutAnswer = currentListData.questionKnockout.result;
  const knockoutDifference = Math.abs(knockoutAnswer - correctKnockoutAnswer);

  if (knockoutAnswer) {
    if (language.startsWith("sv")) {
      knockoutResult.innerHTML = `<span class="result">Du svarade ${knockoutAnswer} och rätt svar var ${correctKnockoutAnswer}, så du var ${knockoutDifference} ifrån det korrekta svaret.</span>`;
    } else {
      knockoutResult.innerHTML = `<span class="result">You answered ${knockoutAnswer} , correct was ${correctKnockoutAnswer}, so you were ${knockoutDifference}, so you were</span>`;
    }
  } else {
    knockoutResult.innerHTML = "";
  }
}

function setSubmitButtonText() {
  const language = navigator.language || navigator.userLanguage;
  const submitButton = document.getElementById("submitBtn");
  const menyButton = document.getElementById("menyBtn");
  const questionListHeading = document.getElementById("questionListHeading");
  const knockoutQuestion = document.getElementById("knockout-question");
  const knockoutQuestionText = document.getElementById("knockout-question-text");

  const currentListData = listQuizdata.find(list => list.QuestionList === currentQuizData);
  knockoutQuestionText.textContent = currentListData.questionKnockout.question;

  if (language.startsWith("sv")) {
    submitButton.textContent = "Skicka";
    menyButton.textContent = "Välj en frågelista";
    questionListHeading.textContent = "Välj en frågelista:";
    knockoutQuestion.textContent = "Utslagsfråga";
  } else {
    submitButton.textContent = "Submit";
    menyButton.textContent = "Select a question list";
    questionListHeading.textContent = "Select a question list:";
    knockoutQuestion.textContent = "Knockout Question";
  }
}

setSubmitButtonText();
displayQuiz();
submitButton.addEventListener("click", showResults);

});

