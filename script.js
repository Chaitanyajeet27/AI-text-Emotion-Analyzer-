// --- DOM Elements ---
const emojiContainer = document.getElementById('emoji-container');
const analyzeBtn = document.getElementById('analyze-btn');
const analyzeArrow = document.getElementById('analyze-arrow');
const analyzeSpinner = document.getElementById('analyze-spinner');
const textInput = document.getElementById('text-input');
const inputSection = document.getElementById('input-section');
const resultSection = document.getElementById('result-section');
const emotionResultsContainer = document.getElementById('emotion-results');
const analyzedTextElement = document.getElementById('analyzed-text');
const backBtn = document.getElementById('back-btn');
const speedBtn = document.getElementById('speed-btn');
const qualityBtn = document.getElementById('quality-btn');
const errorModal = document.getElementById('error-modal');
const errorMessage = document.getElementById('error-message');
const closeErrorModalBtn = document.getElementById('close-error-modal');

// Auth DOM Elements
const authSection = document.getElementById('auth-section');
const appContent = document.getElementById('app-content');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');

// Sidebar and History DOM Elements
const sidebar = document.getElementById('sidebar');
const historyBtn = document.getElementById('history-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const historyList = document.getElementById('history-list');

// --- Data ---
const emojis = ['😍', '🤯', '🥺', '😳', '😀', '😈', '😁', '😠', '😕', '🤢', '😨', '🤗', ' guilt', '❤️', ' lust', ' pride', '😌', '😢', ' shame', '😲'];
const emotions = [
    { name: 'Joy', emoji: '😀' },
    { name: 'Anticipation', emoji: '🤔' },
    { name: 'Optimism', emoji: '😊' },
    { name: 'Anger', emoji: '😠' },
    { name: 'Confusion', emoji: '😕' },
    { name: 'Disgust', emoji: '🤢' },
    { name: 'Fear', emoji: '😨' },
    { name: 'Gratitude', emoji: '🤗' },
    { name: 'Guilt', emoji: '😔' },
    { name: 'Love', emoji: '❤️' },
    { name: 'Lust', emoji: '😈' },
    { name: 'Pride', emoji: '😎' },
    { name: 'Relief', emoji: '😌' },
    { name: 'Sadness', emoji: '😢' },
    { name: 'Shame', emoji: '😳' },
    { name: 'Surprise', emoji: '😲' }
];

const API_URL = 'http://localhost:5000/api'; // Your backend URL

// --- Functions ---

/**
 * Creates and animates floating emojis in the background.
 */
function createFloatingEmojis() {
    const numEmojis = 10;
    for (let i = 0; i < numEmojis; i++) {
        const emoji = document.createElement('div');
        emoji.classList.add('emoji');
        emoji.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        emoji.style.left = `${Math.random() * 100}vw`;
        emoji.style.animationDuration = `${Math.random() * 10 + 10}s`;
        emoji.style.animationDelay = `${Math.random() * 5}s`;
        emoji.style.fontSize = `${Math.random() * 1.5 + 1}rem`;
        emojiContainer.appendChild(emoji);
    }
}

/**
 * Shows or hides the loading spinner on the analyze button.
 * @param {boolean} isLoading - Whether to show the spinner.
 */
function setLoading(isLoading) {
    analyzeBtn.disabled = isLoading;
    if (isLoading) {
        analyzeArrow.classList.add('hidden');
        analyzeSpinner.classList.remove('hidden');
    } else {
        analyzeArrow.classList.remove('hidden');
        analyzeSpinner.classList.add('hidden');
    }
}

/**
 * Shows an error modal with a specific message.
 * @param {string} message - The error message to display.
 */
function showError(message) {
    errorMessage.textContent = message;
    errorModal.classList.remove('hidden');
}

/**
 * Saves a search to the user's history in the backend.
 * @param {string} text - The analyzed text.
 * @param {Array} results - The emotion analysis results.
 */
async function saveToHistory(text, results) {
    const token = localStorage.getItem('token');
    if (token) {
        await fetch(`${API_URL}/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ text, results })
        });
        getHistory(); // Refresh history
    }
}

/**
 * Fetches and displays the user's search history.
 */
async function getHistory() {
    const token = localStorage.getItem('token');
    if (token) {
        const res = await fetch(`${API_URL}/history`, {
            headers: { 'x-auth-token': token }
        });
        const history = await res.json();
        historyList.innerHTML = ''; // Clear previous history
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            
            let resultsHtml = '';
            item.results.slice(0, 3).forEach(result => { // Show top 3 results
                resultsHtml += `<p>${result.emoji} ${result.name}: ${Math.round(result.score * 100)}%</p>`;
            });

            historyItem.innerHTML = `
                <p class="font-semibold mb-2 truncate">"${item.text}"</p>
                <div class="text-sm">${resultsHtml}</div>
                <p class="text-xs text-gray-400 mt-2">${new Date(item.timestamp).toLocaleString()}</p>
            `;
            historyList.appendChild(historyItem);
        });
    }
}


/**
 * Analyzes text using the Gemini API.
 * @param {string} text - The text to analyze.
 * @returns {Promise<Array>} A promise that resolves to an array of emotion objects with scores.
 */
async function analyzeText(text) {
    if (!text.trim()) return [];
    
    setLoading(true);

    //Gemini API key
    const apiKey = "AIzaSyDTA9ASOc6uG5viHJTNI4p2r5tIlpRh8jc"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const prompt = `Analyze the sentiment of the following text and provide a list of emotions with their corresponding scores from 0 to 1. The emotions should include: Joy, Anticipation, Optimism, Anger, Confusion, Disgust, Fear, Gratitude, Guilt, Love, Lust, Pride, Relief, Sadness, Shame, Surprise. Return the result as a JSON array of objects, where each object has 'emotion' and 'score' keys. Text: "${text}"`;

    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        "emotion": { "type": "STRING" },
                        "score": { "type": "NUMBER" }
                    },
                    required: ["emotion", "score"]
                }
            }
        }
    };
    
    try {
        if (apiKey === "YOUR_API_KEY_HERE") {
            throw new Error("Please replace 'YOUR_API_KEY_HERE' with your actual Gemini API key.");
        }

        let response;
        let result;
        let retries = 3;
        let delay = 1000;

        for (let i = 0; i < retries; i++) {
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                result = await response.json();
                break; 
            } else if (response.status === 429 || response.status >= 500) {
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                } else {
                   throw new Error(`API request failed with status ${response.status}`);
                }
            } else {
                 throw new Error(`API request failed with status ${response.status}`);
            }
        }


        if (result.candidates && result.candidates.length > 0) {
            const jsonText = result.candidates[0].content.parts[0].text;
            const apiResults = JSON.parse(jsonText);

            // Map API results to our local emotion data to include emojis
            const finalResults = apiResults.map(apiResult => {
                const localEmotion = emotions.find(e => e.name.toLowerCase() === apiResult.emotion.toLowerCase());
                return {
                    name: apiResult.emotion,
                    score: apiResult.score,
                    emoji: localEmotion ? localEmotion.emoji : '❓' // Default emoji if not found
                };
            }).sort((a, b) => b.score - a.score); // Sort by score descending
            
            await saveToHistory(text, finalResults);
            return finalResults;

        } else {
            throw new Error("Invalid response structure from API.");
        }

    } catch (error) {
        console.error('Error analyzing text:', error);
        showError(`Failed to analyze emotions. ${error.message}`);
        return []; // Return empty array on error
    } finally {
        setLoading(false);
    }
}


/**
 * Renders the emotion analysis results in the UI.
 * @param {Array} results - The array of emotion objects with scores.
 */
function displayResults(results) {
    emotionResultsContainer.innerHTML = ''; // Clear previous results
    if (results.length === 0) {
         emotionResultsContainer.innerHTML = '<p class="text-gray-500">Could not determine emotions. Please try different text.</p>';
         return;
    }

    results.forEach(result => {
        const barWidth = result.score * 100 * 2; // Scale factor for better visibility
        const barColor = result.score > 0.05 ? 'bg-red-400' : 'bg-gray-200';

        const resultElement = `
            <div class="flex items-center">
                <span class="w-8 text-xl">${result.emoji}</span>
                <span class="w-32 text-gray-600">${result.name}</span>
                <div class="flex-1 bg-gray-200 rounded-full h-2.5 mr-4">
                    <div class="result-bar ${barColor} h-2.5 rounded-full" style="width: ${barWidth > 100 ? 100 : barWidth}%"></div>
                </div>
                <span class="w-12 text-right text-gray-500 font-mono">${Math.round(result.score * 100)}%</span>
            </div>
        `;
        emotionResultsContainer.innerHTML += resultElement;
    });
}

/**
 * Toggles between the input and result views.
 */
function toggleView() {
    inputSection.classList.toggle('hidden');
    resultSection.classList.toggle('hidden');
}

// --- Auth Functions ---
function showApp() {
    authSection.classList.add('hidden');
    appContent.classList.remove('hidden');
    getHistory();
}

function showAuth() {
    authSection.classList.remove('hidden');
    appContent.classList.add('hidden');
}

// --- Event Listeners ---

analyzeBtn.addEventListener('click', async () => {
    const text = textInput.value;
    if (!text.trim()) {
        showError("Please enter some text to analyze.");
        return;
    }
    const results = await analyzeText(text);
    
    // Only proceed if there wasn't an error during analysis
    if(results) {
        analyzedTextElement.textContent = text;
        displayResults(results);
        toggleView();
    }
});

backBtn.addEventListener('click', () => {
    toggleView();
});

closeErrorModalBtn.addEventListener('click', () => {
    errorModal.classList.add('hidden');
});

speedBtn.addEventListener('click', () => {
    speedBtn.classList.add('bg-gray-700');
    speedBtn.classList.remove('text-gray-400');
    qualityBtn.classList.remove('bg-gray-700');
    qualityBtn.classList.add('text-gray-400');
});

qualityBtn.addEventListener('click', () => {
    qualityBtn.classList.add('bg-gray-700');
    qualityBtn.classList.remove('text-gray-400');
    speedBtn.classList.remove('bg-gray-700');
    speedBtn.classList.add('text-gray-400');
});

showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

signupBtn.addEventListener('click', async () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    try {
        const res = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.msg || 'Failed to sign up');
        }
        showLogin.click();
    } catch (err) {
        showError(err.message);
    }
});

loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.msg || 'Failed to log in');
        }
        const data = await res.json();
        localStorage.setItem('token', data.token);
        showApp();
    } catch (err) {
        showError(err.message);
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    showAuth();
});

historyBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
});

closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
});


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    createFloatingEmojis();
    const token = localStorage.getItem('token');
    if (token) {
        showApp();
    } else {
        showAuth();
    }
});
