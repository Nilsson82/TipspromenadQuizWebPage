# Tipspromenad Quiz Web Page

This is a simple web page for playing a quiz game called "Tipspromenad", which is a Swedish tradition where participants walk around and answer questions at different stations. A simple and interactive web page for hosting a Tipspromenad quiz with multiple question lists to choose from. The quiz is designed to test participants' knowledge on various topics. You can try the live demo [here](https://nilsson82.github.io/TipspromenadQuizWebPage/).

## Features

- Multiple question lists to choose from
- Customizable answer display (vertical or horizontal)
- Responsive design that works on desktop and mobile devices
- Interactive feedback with correct and incorrect answers

## Getting Started

1. Clone the repository or download the source files.
2. Open the `index.html` file in your preferred web browser.
3. Start answering the quiz questions.
4. Click "Submit" to see your results.
5. Click "Select a question list" to choose from different question lists.

## Customizing the Questions

You can easily customize the quiz data by modifying the `listQuizdata` variable in the `script.js` file. Each element in the array represents a question list with the following properties:

- `listName`: The name of the question list displayed on the web page.
- `answerOptions`: A boolean value indicating whether to display answer options with numbers (e.g., `0: Option A`).
- `answerDisplay`: A string indicating how the answer options should be displayed, either `'horizontally'` or `'vertically'`.
- `QuestionList`: An array of question objects with the following properties:
  - `question`: The question text.
  - `answers`: An array of answer options.
  - `correctAnswer`: The correct answer option.
  - `image`: (Optional) A URL to an image related to the question.

If you would like to customize the questions for the quiz, you can do so by editing the `data_en.json` file in the data folder. Each question is defined as an object with the following properties:

- `question`: The text of the question
- `answers`: An array of possible answers (at least two are required)
- `correctAnswer`: The index of the correct answer in the answers array (starting from 0)
- `image`: (Optional) A URL to an image related to the question.

Simply modify the values for each question to suit your needs.

## License

This project is released under the MIT License. See the `LICENSE` file for more information.
