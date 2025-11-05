/*
* Assignment 3: Functional Prototype
* Programming 2025, Interaction Design Bachelor, Malmö University
* Written by: Illia Chystiakov
*
* GAME CONCEPT:
* LetterFall game using keyboard as a spatial interface.
* Two keyboard interactions: single tap (+1 point) and swipe (+3 points)
*/

// State
let state = {
  score: 0,
  lives: 3,
  currentCombo: [],
  isRunning: false,
  pressed: {},
  letterY: 40,
  prevKey: null,
  currKey: null,
  swipeKeys: [],
  swipeStartTime: 0,
  lastKeyTime: 0,
  lastKeyCode: null
};

// Settings
const settings = {
  triples: [["D","F","G"], ["F","G","H"], ["G","H","J"], ["H","J","K"], ["J","K","L"], ["A","S","D"], ["S","D","F"]],
  singles: ["A","S","D","F","G","H","J","K","L"],
  keyRow: ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL'],
  speed: 2,
  winScore: 10,
  swipeTimeLimit: 800,
  minKeyInterval: 50,
  maxKeyInterval: 250,
  el: {
    container: document.getElementById("falling-row"),
    s1: document.getElementById("slide1"),
    s2: document.getElementById("slide2"),
    score: document.getElementById("score"),
    lives: document.getElementById("lives"),
    over: document.getElementById("game-over"),
    loseLine: document.getElementById("lose-line")
  }
};

// Check keys
function allPressed(combo) {
  for (let i = 0; i < combo.length; i++) {
    if (!state.pressed[combo[i]]) return false;
  }
  return true;
}

// Collision
function hitLoseLine() {
  const fallRect = settings.el.container.getBoundingClientRect();
  const lineRect = settings.el.loseLine.getBoundingClientRect();
  return fallRect.bottom >= lineRect.top;
}

// Swipe
function swipeDirection() {
  let prevIndex = settings.keyRow.indexOf(state.prevKey);
  let currIndex = settings.keyRow.indexOf(state.currKey);
  
  if (currIndex > prevIndex) return 1;
  if (currIndex < prevIndex) return -1;
  return 0;
}

// Check
function checkSwipe() {
  if (!state.isRunning || state.currentCombo.length <= 1) return;
  if (state.swipeKeys.length !== state.currentCombo.length) return;
  
  for (let i = 0; i < state.currentCombo.length; i++) {
    if (state.swipeKeys[i] !== state.currentCombo[i]) return;
  }
  
  state.score += 3;
  state.isRunning = false;
  
  if (state.score >= settings.winScore) {
    settings.el.over.textContent = "You win!";
    settings.el.s1.textContent = "";
  } else {
    setTimeout(newCombo, 400);
  }
}

// Update
function update() {
  if (!state.isRunning) return setTimeout(update, 16);
  
  if (hitLoseLine()) {
    state.lives--;
    state.isRunning = false;
    
    if (state.lives <= 0) {
      settings.el.over.textContent = "Game over!";
      settings.el.s1.textContent = "";
    } else {
      setTimeout(newCombo, 500);
    }
  } else {
    state.letterY += settings.speed;
  }
  
  setTimeout(update, 16);
}

// Render
function use() {
  settings.el.container.style.top = state.letterY + "px";
  settings.el.score.textContent = "Score: " + state.score;
  settings.el.lives.textContent = "Lives: " + state.lives;
  window.requestAnimationFrame(use);
}

// New combo
function newCombo() {
  const isSwipe = Math.random() < 0.5;
  const combo = isSwipe 
    ? settings.triples[Math.floor(Math.random() * settings.triples.length)]
    : [settings.singles[Math.floor(Math.random() * settings.singles.length)]];
  
  state.currentCombo = combo;
  state.isRunning = true;
  state.letterY = 40;
  state.pressed = {};
  state.prevKey = null;
  state.currKey = null;
  state.swipeKeys = [];
  state.swipeStartTime = 0;
  state.lastKeyTime = 0;
  state.lastKeyCode = null;
  
  settings.el.s1.textContent = "";
  settings.el.s2.textContent = "";
  
  if (isSwipe) {
    settings.el.s1.textContent = combo[0] + " " + combo[1] + " " + combo[2];
    settings.el.s2.style.visibility = "hidden";
  } else {
    settings.el.s1.textContent = combo[0];
  }
}

// Check single
function checkSingle() {
  if (!state.isRunning || state.currentCombo.length > 1) return;
  
  if (allPressed(state.currentCombo)) {
    state.score += 1;
    state.isRunning = false;
    
    if (state.score >= settings.winScore) {
      settings.el.over.textContent = "You win!";
      settings.el.s1.textContent = "";
    } else {
      setTimeout(newCombo, 400);
    }
  }
}

// Keyboard handler
function handleKeyDown(e) {
  if (!state.isRunning) return;
  
  const key = e.key.toUpperCase();
  const currentCode = e.code;
  state.pressed[key] = true;
  
  if (state.currentCombo.length > 1) {
    // Swipe logic
    if (state.lastKeyCode !== null && state.lastKeyCode !== currentCode) {
      const timeSinceLastKey = performance.now() - state.lastKeyTime;
      if (timeSinceLastKey < settings.minKeyInterval) {
        state.lastKeyCode = currentCode;
        return;
      }
    }
    
    if (currentCode !== state.currKey) {
      state.prevKey = state.currKey;
      state.currKey = currentCode;
      
      if (state.swipeKeys.length === 0) {
        state.swipeStartTime = performance.now();
        state.swipeKeys.push(key);
        state.lastKeyTime = performance.now();
        state.lastKeyCode = currentCode;
      } else {
        const direction = swipeDirection();
        const timeSinceStart = performance.now() - state.swipeStartTime;
        const timeSinceLastKey = performance.now() - state.lastKeyTime;
        const expectedKey = state.currentCombo[state.swipeKeys.length];
        
        if (key === expectedKey && direction === 1 && 
            timeSinceStart < settings.swipeTimeLimit &&
            timeSinceLastKey >= settings.minKeyInterval && 
            timeSinceLastKey < settings.maxKeyInterval) {
          
          state.swipeKeys.push(key);
          state.lastKeyTime = performance.now();
          state.lastKeyCode = currentCode;
          checkSwipe();
        } else {
          state.swipeKeys = [];
          state.swipeStartTime = performance.now();
          state.lastKeyTime = performance.now();
          state.lastKeyCode = currentCode;
        }
      }
    }
  } else {
    // Single tap
    checkSingle();
  }
}

function handleKeyUp(e) {
  state.pressed[e.key.toUpperCase()] = false;
}

// Setup
function setup() {
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  newCombo();
  update();
  use();
}

setup();
