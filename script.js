// DOM Elements
const todoInput = document.getElementById('todo-input');
const addButton = document.getElementById('add-button');
const todoList = document.getElementById('todo-list');
const historyList = document.getElementById('history-list');
const themeToggle = document.querySelector('.theme-toggle');
const clearHistoryButton = document.getElementById('clear-history');

// Stopwatch Elements
const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const startButton = document.getElementById('start-stopwatch');
const pauseButton = document.getElementById('pause-stopwatch');
const resetButton = document.getElementById('reset-stopwatch');

// App State
let todos = [];
let history = [];
let stopwatchInterval;
let stopwatchRunning = false;
let seconds = 0;
let minutes = 0;
let hours = 0;
let currentTaskId = null;

// Initialize app
function init() {
    loadFromLocalStorage();
    renderTodos();
    renderHistory();
    setupEventListeners();
    checkEmptyStates();
}

// Event Listeners
function setupEventListeners() {
    // Todo functionality
    addButton.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    
    // Stopwatch functionality
    startButton.addEventListener('click', startStopwatch);
    pauseButton.addEventListener('click', pauseStopwatch);
    resetButton.addEventListener('click', resetStopwatch);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Clear history
    clearHistoryButton.addEventListener('click', clearHistory);
}

// Todo Functions
function addTodo() {
    const todoText = todoInput.value.trim();
    if (todoText === '') return;
    
    const todo = {
        id: Date.now(),
        text: todoText,
        completed: false,
        createdAt: new Date()
    };
    
    todos.push(todo);
    addToHistory(`Added task: "${todoText}"`);
    
    todoInput.value = '';
    renderTodos();
    saveToLocalStorage();
    checkEmptyStates();
}

function toggleTodoStatus(id) {
    const todo = todos.find(todo => todo.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        
        if (todo.completed) {
            addToHistory(`Completed task: "${todo.text}"`);
        } else {
            addToHistory(`Unmarked task: "${todo.text}"`);
        }
        
        renderTodos();
        saveToLocalStorage();
    }
}

function deleteTodo(id) {
    const todoIndex = todos.findIndex(todo => todo.id === id);
    if (todoIndex !== -1) {
        const todoText = todos[todoIndex].text;
        todos.splice(todoIndex, 1);
        
        addToHistory(`Deleted task: "${todoText}"`);
        renderTodos();
        saveToLocalStorage();
        checkEmptyStates();
    }
}

function renderTodos() {
    todoList.innerHTML = '';
    
    if (todos.length === 0) {
        todoList.innerHTML = '<div class="empty-state">No tasks yet. Add one above!</div>';
        return;
    }
    
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        const checkbox = document.createElement('span');
        checkbox.className = `checkbox ${todo.completed ? 'checked' : ''}`;
        checkbox.innerHTML = todo.completed ? '<i class="fas fa-check-circle"></i>' : '<i class="far fa-circle"></i>';
        checkbox.addEventListener('click', () => toggleTodoStatus(todo.id));
        
        const todoText = document.createElement('span');
        todoText.className = 'todo-text';
        todoText.textContent = todo.text;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
        
        li.appendChild(checkbox);
        li.appendChild(todoText);
        li.appendChild(deleteBtn);
        todoList.appendChild(li);
    });
}

// History Functions
function addToHistory(action) {
    const historyItem = {
        id: Date.now(),
        action,
        timestamp: new Date()
    };
    
    history.push(historyItem);
    renderHistory();
    saveToLocalStorage();
}

function clearHistory() {
    history = [];
    renderHistory();
    saveToLocalStorage();
    addToHistory("History cleared");
}

function renderHistory() {
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-state">No history yet.</div>';
        return;
    }
    
    // Show most recent history items first (up to 10)
    const recentHistory = [...history].reverse().slice(0, 10);
    
    recentHistory.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        
        const actionText = document.createElement('div');
        actionText.textContent = item.action;
        
        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = formatDate(item.timestamp);
        
        li.appendChild(actionText);
        li.appendChild(timestamp);
        historyList.appendChild(li);
    });
}

// Stopwatch Functions
function startStopwatch() {
    if (stopwatchRunning) return;
    
    stopwatchRunning = true;
    stopwatchInterval = setInterval(updateStopwatch, 1000);
    
    if (!currentTaskId && todos.length > 0) {
        // Find first incomplete task
        const incompleteTasks = todos.filter(todo => !todo.completed);
        if (incompleteTasks.length > 0) {
            currentTaskId = incompleteTasks[0].id;
            addToHistory(`Started timing task: "${incompleteTasks[0].text}"`);
        }
    }
}

function pauseStopwatch() {
    if (!stopwatchRunning) return;
    
    stopwatchRunning = false;
    clearInterval(stopwatchInterval);
    
    if (currentTaskId) {
        const task = todos.find(todo => todo.id === currentTaskId);
        if (task) {
            addToHistory(`Paused timing task: "${task.text}" (${formatTime(hours, minutes, seconds)})`);
        }
    }
}

function resetStopwatch() {
    stopwatchRunning = false;
    clearInterval(stopwatchInterval);
    seconds = 0;
    minutes = 0;
    hours = 0;
    updateStopwatchDisplay();
    
    if (currentTaskId) {
        const task = todos.find(todo => todo.id === currentTaskId);
        if (task) {
            addToHistory(`Reset timer for task: "${task.text}"`);
        }
        currentTaskId = null;
    }
}

function updateStopwatch() {
    seconds++;
    
    if (seconds >= 60) {
        seconds = 0;
        minutes++;
        
        if (minutes >= 60) {
            minutes = 0;
            hours++;
        }
    }
    
    updateStopwatchDisplay();
}

function updateStopwatchDisplay() {
    hoursElement.textContent = hours.toString().padStart(2, '0');
    minutesElement.textContent = minutes.toString().padStart(2, '0');
    secondsElement.textContent = seconds.toString().padStart(2, '0');
}

// Utility Functions
function formatDate(date) {
    return new Date(date).toLocaleString();
}

function formatTime(h, m, s) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function checkEmptyStates() {
    if (todos.length === 0) {
        document.querySelector('.stopwatch-container').style.opacity = '0.5';
    } else {
        document.querySelector('.stopwatch-container').style.opacity = '1';
    }
}

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const icon = themeToggle.querySelector('i');
    
    if (document.body.classList.contains('light-theme')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
    
    localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
}

// Local Storage Functions
function saveToLocalStorage() {
    localStorage.setItem('todos', JSON.stringify(todos));
    localStorage.setItem('history', JSON.stringify(history));
}

function loadFromLocalStorage() {
    const savedTodos = localStorage.getItem('todos');
    const savedHistory = localStorage.getItem('history');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
    }
    
    if (savedHistory) {
        history = JSON.parse(savedHistory);
    }
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        const icon = themeToggle.querySelector('i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);