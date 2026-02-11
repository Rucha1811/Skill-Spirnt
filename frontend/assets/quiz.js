/* Quiz Page JavaScript */

let currentQuestion = null;
let quizState = {
    currentQuestion: 0,
    score: 0,
    correct: 0,
    wrong: 0,
    totalQuestions: 10,
    xpEarned: 0,
    answers: []
};

let quizTimer = null;

async function startQuiz() {
    if (!isLoggedIn()) {
        navigateTo('index.html');
        return;
    }

    quizState = {
        currentQuestion: 1,
        score: 0,
        correct: 0,
        wrong: 0,
        totalQuestions: 10,
        xpEarned: 0,
        answers: []
    };

    await loadQuestion();
    initializeAnimations();
}

async function loadQuestion() {
    if (quizState.currentQuestion > quizState.totalQuestions) {
        showResults();
        return;
    }

    // Get random question
    const response = await API.getRandomQuestion();
    if (!response.success) {
        showNotification('Error loading question', 'error');
        return;
    }

    currentQuestion = response.question;

    // Display question
    document.getElementById('questionNumber').textContent = `Question ${quizState.currentQuestion}`;
    document.getElementById('questionText').textContent = currentQuestion.question;
    document.getElementById('quizStats').textContent = `Question ${quizState.currentQuestion}/${quizState.totalQuestions}`;

    // Display options
    document.getElementById('optionA').textContent = currentQuestion.option_a;
    document.getElementById('optionB').textContent = currentQuestion.option_b;
    document.getElementById('optionC').textContent = currentQuestion.option_c;
    document.getElementById('optionD').textContent = currentQuestion.option_d;

    // Reset feedback
    document.getElementById('feedbackContainer').style.display = 'none';

    // Reset option buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected', 'correct', 'incorrect');
        btn.disabled = false;
    });

    // Start timer
    startQuestionTimer();

    // Animate question entry
    gsap.from(document.querySelector('.question-card'), {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'back.out'
    });
}

function selectOption(option) {
    // Ensure both values are compared as uppercase
    const normalizedCorrect = String(currentQuestion.correct_option).toUpperCase().trim();
    const normalizedSelected = String(option).toUpperCase().trim();
    
    console.log('Selected:', normalizedSelected, 'Correct:', normalizedCorrect, 'Match:', normalizedCorrect === normalizedSelected);
    
    if (normalizedCorrect === normalizedSelected) {
        handleCorrectAnswer(option);
    } else {
        handleIncorrectAnswer(option);
    }
}

function handleCorrectAnswer(option) {
    document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);

    const btn = document.querySelector(`button[onclick="selectOption('${option}')"]`);
    btn.classList.add('correct');

    quizState.correct++;
    quizState.xpEarned += 50;

    showFeedback(true, currentQuestion.explanation);
    triggerConfetti(50);

    clearTimeout(quizTimer);
}

function handleIncorrectAnswer(option) {
    document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);

    const btn = document.querySelector(`button[onclick="selectOption('${option}')"]`);
    btn.classList.add('incorrect');

    document.getElementById('questionText').parentElement.style.animation = 'shake 0.4s ease-out';

    const correctBtn = document.querySelector(`button[onclick="selectOption('${currentQuestion.correct_option}')"]`);
    if (correctBtn) correctBtn.classList.add('correct');

    quizState.wrong++;

    showFeedback(false, currentQuestion.explanation);
    shakeScreen(300);

    clearTimeout(quizTimer);
}

function showFeedback(isCorrect, explanation) {
    const container = document.getElementById('feedbackContainer');
    const message = document.getElementById('feedbackMessage');

    message.textContent = isCorrect ? '✓ Correct!' : '✗ Incorrect';
    message.className = 'feedback-message ' + (isCorrect ? 'correct' : 'incorrect');

    document.getElementById('feedbackExplanation').textContent = explanation;

    container.style.display = 'block';
    gsap.from(container, {
        opacity: 0,
        y: 10,
        duration: 0.3,
        ease: 'back.out'
    });
}

function nextQuestion() {
    quizState.currentQuestion++;
    loadQuestion();
}

function startQuestionTimer() {
    let timeLeft = 30;
    const timerText = document.getElementById('timerText');
    const timerProgress = document.getElementById('timerProgress');

    quizTimer = setInterval(() => {
        timeLeft--;
        timerText.textContent = timeLeft + 's';

        // Update progress circle
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (timeLeft / 30) * circumference;
        timerProgress.style.strokeDashoffset = offset;

        if (timeLeft <= 0) {
            clearInterval(quizTimer);
            handleTimeUp();
        }
    }, 1000);
}

function handleTimeUp() {
    document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);

    const correctBtn = document.querySelector(`button[onclick="selectOption('${currentQuestion.correct_option}')"]`);
    if (correctBtn) correctBtn.classList.add('correct');

    quizState.wrong++;
    showFeedback(false, 'Time\'s up! ' + currentQuestion.explanation);
}

function showResults() {
    document.getElementById('quizScreen').style.display = 'none';
    document.getElementById('resultsScreen').style.display = 'flex';

    const score = Math.round((quizState.correct / quizState.totalQuestions) * 100);
    const scoreElement = document.getElementById('scoreValue');

    // Animate score
    let currentScore = 0;
    const scoreInterval = setInterval(() => {
        currentScore += Math.ceil(score / 30);
        if (currentScore >= score) {
            scoreElement.textContent = score + '%';
            clearInterval(scoreInterval);
        } else {
            scoreElement.textContent = currentScore + '%';
        }
    }, 30);

    document.getElementById('correctCount').textContent = quizState.correct;
    document.getElementById('wrongCount').textContent = quizState.wrong;
    document.getElementById('xpEarned').textContent = quizState.xpEarned;

    // Save quiz stats and update user XP
    if (isLoggedIn()) {
        API.updateXP(getCurrentUserId(), quizState.xpEarned);
    }

    triggerConfetti(150);
}

function restartQuiz() {
    document.getElementById('quizScreen').style.display = 'flex';
    document.getElementById('resultsScreen').style.display = 'none';
    startQuiz();
}

document.addEventListener('DOMContentLoaded', startQuiz);
