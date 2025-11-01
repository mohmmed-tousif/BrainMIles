const API_URL = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  
  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    return null;
  }
  
  return response;
}

function showAlert(message, type = 'error') {
  const container = document.getElementById('alert-container');
  if (!container) return;
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  container.innerHTML = '';
  container.appendChild(alert);
  
  setTimeout(() => alert.remove(), 5000);
}

// Create Quiz Form Handler
const createQuizForm = document.getElementById('create-quiz-form');
if (createQuizForm) {
  createQuizForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const topic = document.getElementById('topic').value;
    const content = document.getElementById('content').value;
    
    if (content.length < 100) {
      showAlert('Please provide more detailed content (at least 100 characters)');
      return;
    }
    
    const createText = document.getElementById('create-text');
    const createLoading = document.getElementById('create-loading');
    
    createText.classList.add('hidden');
    createLoading.classList.remove('hidden');
    
    try {
      const response = await fetchWithAuth(`${API_URL}/quiz/create`, {
        method: 'POST',
        body: JSON.stringify({ topic, content })
      });
      
      if (!response) return;
      
      const data = await response.json();
      
      if (response.ok) {
        showAlert('Quiz created successfully! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = `take-quiz.html?id=${data.quizId}`;
        }, 1000);
      } else {
        showAlert(data.message || 'Failed to create quiz');
        createText.classList.remove('hidden');
        createLoading.classList.add('hidden');
      }
    } catch (error) {
      showAlert('Network error. Please try again.');
      createText.classList.remove('hidden');
      createLoading.classList.add('hidden');
    }
  });
}

// Take Quiz Page
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];

async function loadQuiz() {
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get('id');
  
  if (!quizId) {
    window.location.href = 'dashboard.html';
    return;
  }
  
  try {
    const response = await fetchWithAuth(`${API_URL}/quiz/${quizId}`);
    if (!response) return;
    
    currentQuiz = await response.json();
    userAnswers = new Array(currentQuiz.questions.length).fill(null);
    
    const loadingContainer = document.getElementById('loading-container');
    const quizContainer = document.getElementById('quiz-container');
    
    if (loadingContainer) loadingContainer.classList.add('hidden');
    if (quizContainer) quizContainer.classList.remove('hidden');
    
    document.getElementById('quiz-topic').textContent = currentQuiz.topic;
    document.getElementById('total-questions').textContent = currentQuiz.questions.length;
    
    displayQuestion();
  } catch (error) {
    console.error('Error loading quiz:', error);
  }
}

function displayQuestion() {
  const question = currentQuiz.questions[currentQuestionIndex];
  
  document.getElementById('current-question').textContent = currentQuestionIndex + 1;
  document.getElementById('question-text').textContent = question.question;
  
  const optionsContainer = document.getElementById('options-container');
  optionsContainer.innerHTML = question.options.map((option, index) => `
    <div class="option ${userAnswers[currentQuestionIndex] === index ? 'selected' : ''}" 
         onclick="selectOption(${index})">
      <strong>${String.fromCharCode(65 + index)}.</strong> ${option}
    </div>
  `).join('');
  
  // Update navigation buttons
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const submitBtn = document.getElementById('submit-btn');
  
  prevBtn.disabled = currentQuestionIndex === 0;
  
  if (currentQuestionIndex === currentQuiz.questions.length - 1) {
    nextBtn.classList.add('hidden');
    submitBtn.classList.remove('hidden');
  } else {
    nextBtn.classList.remove('hidden');
    submitBtn.classList.add('hidden');
  }
}

function selectOption(optionIndex) {
  userAnswers[currentQuestionIndex] = optionIndex;
  displayQuestion();
}

// Navigation handlers
const prevBtn = document.getElementById('prev-btn');
if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      displayQuestion();
    }
  });
}

const nextBtn = document.getElementById('next-btn');
if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      currentQuestionIndex++;
      displayQuestion();
    }
  });
}

const submitBtn = document.getElementById('submit-btn');
if (submitBtn) {
  submitBtn.addEventListener('click', async () => {
    // Check if all questions are answered
    if (userAnswers.includes(null)) {
      alert('Please answer all questions before submitting.');
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
      const response = await fetchWithAuth(`${API_URL}/quiz/submit/${currentQuiz._id}`, {
        method: 'POST',
        body: JSON.stringify({ answers: userAnswers })
      });
      
      if (!response) return;
      
      const results = await response.json();
      
      // Store results in sessionStorage and redirect
      sessionStorage.setItem('quizResults', JSON.stringify(results));
      window.location.href = 'results.html';
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Quiz';
    }
  });
}

// Results Page
function displayResults() {
  const results = JSON.parse(sessionStorage.getItem('quizResults'));
  
  if (!results) {
    window.location.href = 'dashboard.html';
    return;
  }
  
  const percentage = (results.score / results.total) * 100;
  
  document.getElementById('score').textContent = `${results.score}/${results.total}`;
  document.getElementById('percentage').textContent = `${percentage.toFixed(1)}%`;
  document.getElementById('earnings').textContent = `${results.earnings.toFixed(2)}`;
  
  // Set emoji based on performance
  const emoji = percentage >= 90 ? '🎉' : percentage >= 70 ? '👏' : percentage >= 50 ? '👍' : '📚';
  document.getElementById('result-emoji').textContent = emoji;
  
  // Display detailed results
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.innerHTML = results.results.map((result, index) => `
    <div class="card mb-2" style="background: ${result.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border-color: ${result.isCorrect ? 'var(--success)' : 'var(--danger)'};">
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
        <div style="font-size: 2rem;">${result.isCorrect ? '✅' : '❌'}</div>
        <h3 style="flex: 1;">Question ${index + 1}</h3>
      </div>
      <p style="margin-bottom: 1rem; font-size: 1.1rem;">${result.question}</p>
      <div style="margin-bottom: 0.5rem;">
        <strong>Your answer:</strong> ${result.userAnswer !== null ? String.fromCharCode(65 + result.userAnswer) : 'No answer'}
      </div>
      ${!result.isCorrect ? `
        <div style="margin-bottom: 0.5rem;">
          <strong>Correct answer:</strong> ${String.fromCharCode(65 + result.correctAnswer)}
        </div>
      ` : ''}
      <div style="margin-top: 1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px;">
        <strong>Explanation:</strong> ${result.explanation}
      </div>
    </div>
  `).join('');
  
  // Clear session storage
  sessionStorage.removeItem('quizResults');
}

// Initialize based on page
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();
  
  if (page === 'take-quiz.html') {
    loadQuiz();
  } else if (page === 'results.html') {
    displayResults();
  }
});