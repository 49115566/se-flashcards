/**
 * SE Flashcards Application
 * CS 5/7-328 Software Engineering - Fall 2025
 * 
 * Main application module for flashcard study system
 */

// ============== State Management ==============
const state = {
    decks: [],
    currentDeck: null,
    currentDeckIndex: 0,
    currentCardIndex: 0,
    cards: [],
    studyMode: 'study',
    isFlipped: false,
    sessionStats: {
        total: 0,
        easy: 0,
        good: 0,
        hard: 0,
        again: 0,
        mistakes: []
    },
    progress: {},
    theme: 'light'
};

// ============== DOM Elements ==============
const elements = {
    // Views
    deckSelection: document.getElementById('deck-selection'),
    modeSelection: document.getElementById('mode-selection'),
    studyView: document.getElementById('study-view'),
    sessionComplete: document.getElementById('session-complete'),
    
    // Deck Selection
    decksContainer: document.getElementById('decks-container'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    totalCards: document.getElementById('total-cards'),
    cardsStudied: document.getElementById('cards-studied'),
    cardsMastered: document.getElementById('cards-mastered'),
    studySessions: document.getElementById('study-sessions'),
    overallProgress: document.getElementById('overall-progress'),
    resetProgressBtn: document.getElementById('reset-progress-btn'),
    
    // Mode Selection
    backToDecks: document.getElementById('back-to-decks'),
    selectedDeckTitle: document.getElementById('selected-deck-title'),
    selectedDeckDescription: document.getElementById('selected-deck-description'),
    deckTotal: document.getElementById('deck-total'),
    deckNew: document.getElementById('deck-new'),
    deckLearning: document.getElementById('deck-learning'),
    deckMastered: document.getElementById('deck-mastered'),
    modeCards: document.querySelectorAll('.mode-card'),
    
    // Study View
    backToModes: document.getElementById('back-to-modes'),
    currentCardNum: document.getElementById('current-card-num'),
    totalCardsNum: document.getElementById('total-cards-num'),
    bookmarkBtn: document.getElementById('bookmark-btn'),
    shuffleCurrentBtn: document.getElementById('shuffle-current-btn'),
    flashcard: document.getElementById('flashcard'),
    cardCategory: document.getElementById('card-category'),
    cardQuestion: document.getElementById('card-question'),
    cardAnswer: document.getElementById('card-answer'),
    cardDetails: document.getElementById('card-details'),
    prevCard: document.getElementById('prev-card'),
    nextCard: document.getElementById('next-card'),
    confidenceBtns: document.querySelectorAll('.btn-confidence'),
    studyProgressBar: document.getElementById('study-progress-bar'),
    
    // Session Complete
    sessionTotal: document.getElementById('session-total'),
    sessionEasy: document.getElementById('session-easy'),
    sessionGood: document.getElementById('session-good'),
    sessionHard: document.getElementById('session-hard'),
    sessionAgain: document.getElementById('session-again'),
    studyAgain: document.getElementById('study-again'),
    reviewMistakes: document.getElementById('review-mistakes'),
    backHome: document.getElementById('back-home'),
    
    // Theme
    themeToggle: document.getElementById('theme-toggle')
};

// ============== Deck Configuration ==============
const deckConfig = [
    { id: 'process', file: 'process.json', icon: '🔄', category: 'process' },
    { id: 'scrum', file: 'scrum.json', icon: '🏃', category: 'process' },
    { id: 'best-practices', file: 'best-practices.json', icon: '⭐', category: 'process' },
    { id: 'requirements', file: 'requirements.json', icon: '📋', category: 'requirements' },
    { id: 'databases', file: 'databases.json', icon: '🗄️', category: 'requirements' },
    { id: 'ooa', file: 'ooa.json', icon: '🔍', category: 'design' },
    { id: 'ooad', file: 'ooad.json', icon: '🏗️', category: 'design' },
    { id: 'architecture', file: 'architecture.json', icon: '🏛️', category: 'architecture' },
    { id: 'architectural-styles', file: 'architectural-styles.json', icon: '🎨', category: 'architecture' },
    { id: 'creational-patterns', file: 'creational-patterns.json', icon: '🏭', category: 'patterns' },
    { id: 'structural-patterns', file: 'structural-patterns.json', icon: '🧱', category: 'patterns' },
    { id: 'behavioral-patterns', file: 'behavioral-patterns.json', icon: '🎭', category: 'patterns' },
    { id: 'apis', file: 'apis.json', icon: '🔗', category: 'architecture' },
    { id: 'testing', file: 'testing.json', icon: '🧪', category: 'testing' },
    { id: 'unit-testing', file: 'unit-testing.json', icon: '✅', category: 'testing' },
    { id: 'quality-attributes', file: 'quality-attributes.json', icon: '📊', category: 'quality' },
    { id: 'devops', file: 'devops.json', icon: '🚀', category: 'devops' },
    { id: 'ml-in-se', file: 'ml-in-se.json', icon: '🤖', category: 'devops' }
];

// ============== Initialization ==============
async function init() {
    loadTheme();
    loadProgress();
    await loadDecks();
    renderDecks();
    updateOverallStats();
    setupEventListeners();
}

// ============== Theme Management ==============
function loadTheme() {
    const savedTheme = localStorage.getItem('se-flashcards-theme') || 'light';
    state.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('se-flashcards-theme', state.theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = elements.themeToggle.querySelector('.icon');
    icon.textContent = state.theme === 'light' ? '🌙' : '☀️';
}

// ============== Progress Management ==============
function loadProgress() {
    const savedProgress = localStorage.getItem('se-flashcards-progress');
    if (savedProgress) {
        state.progress = JSON.parse(savedProgress);
    }
}

function saveProgress() {
    localStorage.setItem('se-flashcards-progress', JSON.stringify(state.progress));
}

function resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        state.progress = {};
        saveProgress();
        renderDecks();
        updateOverallStats();
    }
}

function getCardProgress(deckId, cardIndex) {
    if (!state.progress[deckId]) {
        state.progress[deckId] = {};
    }
    return state.progress[deckId][cardIndex] || { status: 'new', reviews: 0 };
}

function setCardProgress(deckId, cardIndex, confidence) {
    if (!state.progress[deckId]) {
        state.progress[deckId] = {};
    }
    
    const current = state.progress[deckId][cardIndex] || { status: 'new', reviews: 0 };
    let newStatus = current.status;
    
    if (confidence === 'easy') {
        newStatus = 'mastered';
    } else if (confidence === 'good') {
        newStatus = current.status === 'new' ? 'learning' : 'mastered';
    } else if (confidence === 'hard') {
        newStatus = 'learning';
    } else if (confidence === 'again') {
        newStatus = 'learning';
    }
    
    state.progress[deckId][cardIndex] = {
        status: newStatus,
        reviews: current.reviews + 1,
        lastReview: Date.now()
    };
    
    saveProgress();
}

// ============== Deck Loading ==============
async function loadDecks() {
    const loadPromises = deckConfig.map(async (config) => {
        try {
            const response = await fetch(`data/${config.file}`);
            if (!response.ok) {
                console.warn(`Could not load ${config.file}`);
                return null;
            }
            const data = await response.json();
            return {
                ...config,
                ...data
            };
        } catch (error) {
            console.warn(`Error loading ${config.file}:`, error);
            return null;
        }
    });
    
    const results = await Promise.all(loadPromises);
    state.decks = results.filter(deck => deck !== null);
}

// ============== Rendering ==============
function renderDecks() {
    elements.decksContainer.innerHTML = '';
    
    state.decks.forEach((deck, index) => {
        const deckEl = createDeckCard(deck, index);
        elements.decksContainer.appendChild(deckEl);
    });
}

function createDeckCard(deck, index) {
    const progress = calculateDeckProgress(deck.id, deck.cards.length);
    
    const deckEl = document.createElement('div');
    deckEl.className = 'deck-card';
    deckEl.setAttribute('data-category', deck.category);
    deckEl.setAttribute('data-index', index);
    
    deckEl.innerHTML = `
        <div class="deck-icon">${deck.icon}</div>
        <h3 class="deck-title">${deck.title}</h3>
        <p class="deck-description">${deck.description}</p>
        <div class="deck-meta">
            <span class="deck-count">${deck.cards.length} cards</span>
            <div class="deck-progress">
                <div class="deck-progress-bar">
                    <div class="deck-progress-fill" style="width: ${progress.percentage}%"></div>
                </div>
                <span class="deck-progress-text">${progress.percentage}%</span>
            </div>
        </div>
    `;
    
    deckEl.addEventListener('click', () => selectDeck(index));
    return deckEl;
}

function calculateDeckProgress(deckId, totalCards) {
    if (!state.progress[deckId]) {
        return { mastered: 0, learning: 0, new: totalCards, percentage: 0 };
    }
    
    let mastered = 0;
    let learning = 0;
    
    for (let i = 0; i < totalCards; i++) {
        const cardProgress = state.progress[deckId][i];
        if (cardProgress) {
            if (cardProgress.status === 'mastered') mastered++;
            else if (cardProgress.status === 'learning') learning++;
        }
    }
    
    const percentage = Math.round((mastered / totalCards) * 100);
    
    return {
        mastered,
        learning,
        new: totalCards - mastered - learning,
        percentage
    };
}

function updateOverallStats() {
    let totalCards = 0;
    let cardsStudied = 0;
    let cardsMastered = 0;
    
    state.decks.forEach(deck => {
        totalCards += deck.cards.length;
        const progress = calculateDeckProgress(deck.id, deck.cards.length);
        cardsStudied += progress.mastered + progress.learning;
        cardsMastered += progress.mastered;
    });
    
    const sessions = parseInt(localStorage.getItem('se-flashcards-sessions') || '0');
    
    elements.totalCards.textContent = totalCards;
    elements.cardsStudied.textContent = cardsStudied;
    elements.cardsMastered.textContent = cardsMastered;
    elements.studySessions.textContent = sessions;
    
    const percentage = totalCards > 0 ? (cardsMastered / totalCards) * 100 : 0;
    elements.overallProgress.style.width = `${percentage}%`;
}

// ============== Navigation ==============
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
}

function selectDeck(index) {
    state.currentDeckIndex = index;
    state.currentDeck = state.decks[index];
    
    elements.selectedDeckTitle.textContent = state.currentDeck.title;
    elements.selectedDeckDescription.textContent = state.currentDeck.description;
    
    const progress = calculateDeckProgress(state.currentDeck.id, state.currentDeck.cards.length);
    elements.deckTotal.textContent = state.currentDeck.cards.length;
    elements.deckNew.textContent = progress.new;
    elements.deckLearning.textContent = progress.learning;
    elements.deckMastered.textContent = progress.mastered;
    
    showView('mode-selection');
}

function selectMode(mode) {
    state.studyMode = mode;
    state.currentCardIndex = 0;
    state.cards = [...state.currentDeck.cards];
    state.sessionStats = { total: 0, easy: 0, good: 0, hard: 0, again: 0, mistakes: [] };
    
    if (mode === 'shuffle') {
        shuffleCards();
    } else if (mode === 'review') {
        // Filter to only learning/difficult cards
        state.cards = state.cards.filter((card, index) => {
            const progress = getCardProgress(state.currentDeck.id, index);
            return progress.status !== 'mastered';
        });
        if (state.cards.length === 0) {
            alert('No cards to review! All cards are mastered.');
            return;
        }
    }
    
    elements.totalCardsNum.textContent = state.cards.length;
    updateCard();
    showView('study-view');
    
    // Increment session count
    const sessions = parseInt(localStorage.getItem('se-flashcards-sessions') || '0') + 1;
    localStorage.setItem('se-flashcards-sessions', sessions.toString());
}

// ============== Card Management ==============
function shuffleCards() {
    for (let i = state.cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.cards[i], state.cards[j]] = [state.cards[j], state.cards[i]];
    }
}

function updateCard() {
    if (state.currentCardIndex >= state.cards.length) {
        showSessionComplete();
        return;
    }
    
    const card = state.cards[state.currentCardIndex];
    
    elements.cardCategory.textContent = card.category || state.currentDeck.title;
    elements.cardQuestion.textContent = card.question;
    elements.cardAnswer.textContent = card.answer;
    elements.cardDetails.textContent = card.details || '';
    elements.cardDetails.style.display = card.details ? 'block' : 'none';
    
    elements.currentCardNum.textContent = state.currentCardIndex + 1;
    
    // Update progress bar
    const progressPercent = ((state.currentCardIndex) / state.cards.length) * 100;
    elements.studyProgressBar.style.width = `${progressPercent}%`;
    
    // Reset flip state
    state.isFlipped = false;
    elements.flashcard.classList.remove('flipped');
    
    // Update nav buttons
    elements.prevCard.disabled = state.currentCardIndex === 0;
}

function flipCard() {
    state.isFlipped = !state.isFlipped;
    elements.flashcard.classList.toggle('flipped', state.isFlipped);
}

function nextCard() {
    if (state.currentCardIndex < state.cards.length - 1) {
        state.currentCardIndex++;
        updateCard();
    } else {
        showSessionComplete();
    }
}

function prevCard() {
    if (state.currentCardIndex > 0) {
        state.currentCardIndex--;
        updateCard();
    }
}

function rateCard(confidence) {
    const originalIndex = state.currentDeck.cards.indexOf(state.cards[state.currentCardIndex]);
    setCardProgress(state.currentDeck.id, originalIndex, confidence);
    
    state.sessionStats.total++;
    state.sessionStats[confidence]++;
    
    if (confidence === 'again' || confidence === 'hard') {
        state.sessionStats.mistakes.push(state.cards[state.currentCardIndex]);
    }
    
    nextCard();
}

// ============== Session Complete ==============
function showSessionComplete() {
    elements.sessionTotal.textContent = state.sessionStats.total;
    elements.sessionEasy.textContent = state.sessionStats.easy;
    elements.sessionGood.textContent = state.sessionStats.good;
    elements.sessionHard.textContent = state.sessionStats.hard;
    elements.sessionAgain.textContent = state.sessionStats.again;
    
    elements.reviewMistakes.disabled = state.sessionStats.mistakes.length === 0;
    
    updateOverallStats();
    showView('session-complete');
}

function studyAgain() {
    selectMode(state.studyMode);
}

function reviewMistakes() {
    if (state.sessionStats.mistakes.length > 0) {
        state.cards = [...state.sessionStats.mistakes];
        state.currentCardIndex = 0;
        state.sessionStats = { total: 0, easy: 0, good: 0, hard: 0, again: 0, mistakes: [] };
        elements.totalCardsNum.textContent = state.cards.length;
        updateCard();
        showView('study-view');
    }
}

// ============== Filtering ==============
function filterDecks(category) {
    document.querySelectorAll('.deck-card').forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

// ============== Event Listeners ==============
function setupEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Filter buttons
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterDecks(btn.dataset.filter);
        });
    });
    
    // Reset progress
    elements.resetProgressBtn.addEventListener('click', resetProgress);
    
    // Navigation
    elements.backToDecks.addEventListener('click', () => showView('deck-selection'));
    elements.backToModes.addEventListener('click', () => showView('mode-selection'));
    
    // Mode selection
    elements.modeCards.forEach(card => {
        card.addEventListener('click', () => selectMode(card.dataset.mode));
    });
    
    // Flashcard
    elements.flashcard.addEventListener('click', flipCard);
    elements.prevCard.addEventListener('click', prevCard);
    elements.nextCard.addEventListener('click', nextCard);
    
    // Confidence buttons
    elements.confidenceBtns.forEach(btn => {
        btn.addEventListener('click', () => rateCard(btn.dataset.confidence));
    });
    
    // Shuffle current deck
    elements.shuffleCurrentBtn.addEventListener('click', () => {
        shuffleCards();
        state.currentCardIndex = 0;
        updateCard();
    });
    
    // Session complete actions
    elements.studyAgain.addEventListener('click', studyAgain);
    elements.reviewMistakes.addEventListener('click', reviewMistakes);
    elements.backHome.addEventListener('click', () => {
        showView('deck-selection');
        renderDecks();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

function handleKeyboard(e) {
    // Only handle if study view is active
    if (!elements.studyView.classList.contains('active')) return;
    
    switch(e.key) {
        case ' ':
        case 'Enter':
            e.preventDefault();
            flipCard();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            prevCard();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            nextCard();
            break;
        case '1':
            rateCard('again');
            break;
        case '2':
            rateCard('hard');
            break;
        case '3':
            rateCard('good');
            break;
        case '4':
            rateCard('easy');
            break;
    }
}

// ============== Start Application ==============
init();
