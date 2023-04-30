let listQuizdata = [];

document.addEventListener("DOMContentLoaded", function () {
  // If listQuizdata is empty, fetch data from the external JSON file
  if (listQuizdata.length === 0) {
    const language = navigator.language || navigator.userLanguage;
    const languageCode = language.split("-")[0];
    const jsonDataUrl = `https://raw.githubusercontent.com/Nilsson82/TipspromenadQuizWebPage/main/Data/data_${languageCode}.json`;

    fetchQuizData(jsonDataUrl).then((fetchedData) => {
      listQuizdata = fetchedData;
      initQuiz();
    });
  } else {
    initQuiz();
  }
});

function fetchQuizData(url) {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
}

function initQuiz() {
  let currentQuizData = listQuizdata[0].QuestionList; // set quizData as the default
  let currentListData = listQuizdata.find(
    (list) => list.QuestionList === currentQuizData
  );

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
  const questionListContainer = document.getElementById(
    "questionListContainer"
  );

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
    currentListData = listQuizdata.find(
      (list) => list.QuestionList === currentQuizData
    );

    document.getElementById("listName").textContent = currentListData.listName;

    // Update the knockoutQuestionText
    if (currentListData.questionKnockout) {
      const knockoutQuestionText = document.getElementById(
        "knockout-question-text"
      );
      knockoutQuestionText.textContent =
        currentListData.questionKnockout.question;
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
      <div class="answers ${
        answerDisplay === "horizontally"
          ? "horizontal-display"
          : "vertical-display"
      }"> ${answers.join("")} </div>`
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
  
      const correctAnswerIndex = currentQuestion.answers.indexOf(
        currentQuestion.correctAnswer
      );
  
      if (userAnswer == correctAnswerIndex) {
        numCorrect++;
  
        // Apply the correct CSS class
        answerContainers[questionNumber].classList.add("correct");
      } else {
        // Apply the incorrect CSS class
        answerContainers[questionNumber].classList.add("incorrect");
      }
  
      // Add the following loop to mark answers with correct and incorrect CSS classes
      const answerLabels = answerContainer.querySelectorAll("label");
      answerLabels.forEach((label, answerIndex) => {
        if (answerIndex == correctAnswerIndex) {
          label.classList.add("correct-answer");
        } else if (answerIndex == userAnswer) {
          label.classList.add("incorrect-answer");
        }
      });
  
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
      resultsContainer.innerHTML = `<span class="result">Du har besvarat ${numCorrect} av ${currentQuizData.length} frågor korrekt!</span>`;
    } else if (language.startsWith("es")) {
      resultsContainer.innerHTML = `<span class="result">Has respondido correctamente ${numCorrect} de ${currentQuizData.length} preguntas!</span>`;
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
      } else if (language.startsWith("es")) {
        knockoutResult.innerHTML = `<span class="result">Respondiste ${knockoutAnswer} y la respuesta correcta era ${correctKnockoutAnswer}, así que estuviste a ${knockoutDifference} de la respuesta correcta.</span>`;
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
    const knockoutQuestionText = document.getElementById(
      "knockout-question-text"
    );

    const currentListData = listQuizdata.find(
      (list) => list.QuestionList === currentQuizData
    );
    knockoutQuestionText.textContent =
      currentListData.questionKnockout.question;

    if (language.startsWith("sv")) {
      submitButton.textContent = "Skicka";
      menyButton.textContent = "Välj en frågelista";
      questionListHeading.textContent = "Välj en frågelista:";
      knockoutQuestion.textContent = "Utslagsfråga";
    } else if (language.startsWith("es")) {
      submitButton.textContent = "Enviar";
      menyButton.textContent = "Seleccionar una lista de preguntas";
      questionListHeading.textContent = "Seleccionar una lista de preguntas:";
      knockoutQuestion.textContent = "Pregunta de eliminación";
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
}
