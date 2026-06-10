// Watch Face

let pomodoroStartTime;
let pomodoroDuration = 4 * 60; // 4 minutes in seconds (total activity time)
let showPauseScreen = false;
let pauseActive = false; // Variable to know if pause is active
let pauseStartTime; // When pause started
let currentLevel = 0; // Current circle level (0-3)
let circleTargets = [75, 150, 225, 300]; // Circle sizes where it pauses
let pauseDuration = 5; // 5 minutes base pause
let accumulatedPauseTime = 5; // Accumulated pause time (starts with 5 min)
let justLeftPause = false; // Flag to avoid overlapping pauses
let justLeftPauseTimer = 0; // Timer to reset flag

// Activity loop system - Full day schedule (24h)
let currentActivity = 0;
let activities = [
  // Morning (8h-13h)
  {
    name: "NOW: ACORDAR",
    next: "NEXT: AULA PROJETO | 09H30",
    startTime: 8 * 60,
    duration: 1.25 * 60 * 60,
    hasPauses: false,
    circleTargets: [300]
  },
  {
    name: "NOW: AULA PROJETO",
    next: "NEXT: ALMOÇO | 13H00",
    startTime: 9.5 * 60,
    duration: 3.5 * 60 * 60,
    hasPauses: true,
    circleTargets: [75, 150, 225, 300]
  },
  
  // Afternoon (13h-18h15)
  {
    name: "NOW: ALMOÇO",
    next: "NEXT: AULA PROJETO | 14H00",
    startTime: 13 * 60,
    duration: 1 * 60 * 60,
    hasPauses: false,
    circleTargets: [300]
  },
  {
    name: "NOW: AULA PROJETO",
    next: "NEXT: Vazio | 16H30",
    startTime: 14 * 60,
    duration: 2.5 * 60 * 60,
    hasPauses: true,
    circleTargets: [75, 150, 225, 300]
  },
  {
    name: "NOW: Vazio",
    next: "NEXT: GYM | 17H00",
    startTime: 16.5 * 60,
    duration: 0.5 * 60 * 60,
    hasPauses: false,
    circleTargets: [300]
  },
  {
    name: "NOW: GYM",
    next: "NEXT: IR PARA CASA | 18H00",
    startTime: 17 * 60,
    duration: 1 * 60 * 60,
    hasPauses: false,
    circleTargets: [300]
  },
  {
    name: "NOW: IR PARA CASA",
    next: "NEXT: Modo Zen | 18H15",
    startTime: 18 * 60,
    duration: 0.25 * 60 * 60,
    hasPauses: false,
    circleTargets: [300]
  },
  
  // Evening (18h15-00h)
  {
    name: "NOW: Modo Zen",
    next: "NEXT: JANTAR | 19H00",
    startTime: 18.25 * 60,
    duration: 0.75 * 60 * 60,
    hasPauses: false,
    circleTargets: [300]
  },
  {
    name: "NOW: JANTAR",
    next: "NEXT: TRABALHOS | 20H30",
    startTime: 19 * 60,
    duration: 1.5 * 60 * 60,
    hasPauses: false,
    circleTargets: [300]
  },
  {
    name: "NOW: TRABALHOS",
    next: "NEXT: Modo Zen | 22H00",
    startTime: 20.5 * 60,
    duration: 1.5 * 60 * 60,
    hasPauses: true,
    circleTargets: [75, 150, 225, 300]
  },
  {
    name: "NOW: Modo Zen",
    next: "NEXT: DORMIR | 00H00",
    startTime: 22 * 60,
    duration: 2 * 60 * 60,
    hasPauses: false,
    circleTargets: [300],
    nightMode: true,
    transitionMessage: "Está na hora de ir dormir"
  },
  
  // Night (00h-8h)
  {
    name: "NOW: DORMIR",
    next: "NEXT: ACORDAR | 08H00",
    startTime: 0 * 60,
    duration: 8 * 60 * 60,
    hasPauses: false,
    circleTargets: [300],
    nightMode: true,
    sleepMode: true
  }
];

// Transition animation
let showTransition = false;
let transitionStartTime = 0;
let transitionDuration = 4000;

// Motivational quotes (for transition only)
let quotes = [
  "Tu consegues!",
  "Estás a ir bem!",
  "Foca-te",
  "Passo a passo",
  "Quase lá!",
  "Faz valer a pena",
  "Não desistas",
  "Novo ciclo.",
  "Bora lá!"
];
let currentQuote = "";

// Speed multiplier for testing
let speedMultiplier = 1;

// Custom fonts
let fontHoras; // Bricolage Grotesque ExtraBold for hours
let fontTexto; // Montserrat SemiBold for text

function preload() {
  // Load custom fonts
  fontHoras = loadFont('BricolageGrotesque-ExtraBold.ttf');
  fontTexto = loadFont('Montserrat-SemiBold.ttf');
}

// Vibration simulation
let vibrationActive = false;
let vibrationStartTime = 0;
let vibrationDuration = 500; // Reduzido de 800 para 500ms
let vibrationIntensity = 0;

function setup() {
    var myCanvas = createCanvas(450, 450);
    myCanvas.parent("pjCanvas");
  //createCanvas(450, 450);
  textAlign(CENTER, CENTER);
  pomodoroStartTime = millis();
  
  pomodoroDuration = activities[currentActivity].duration;
  circleTargets = activities[currentActivity].circleTargets;
  
  currentQuote = random(quotes);
}

function draw() {
  background(0);
  
  let centerX = width / 2;
  let centerY = height / 2;
  
  // Handle vibration effect
  if (vibrationActive) {
    let vibrationElapsed = millis() - vibrationStartTime;
    if (vibrationElapsed < vibrationDuration) {
      vibrationIntensity = map(vibrationElapsed, 0, vibrationDuration, 5, 0);
      translate(random(-vibrationIntensity, vibrationIntensity), random(-vibrationIntensity, vibrationIntensity));
    } else {
      vibrationActive = false;
      vibrationIntensity = 0;
    }
  }
  
  // ===== SLEEP MODE SPECIAL SCREEN =====
  if (activities[currentActivity].sleepMode) {
    drawSleepMode(centerX, centerY);
    return;
  }
  
  // ===== TRANSITION ANIMATION =====
  if (showTransition) {
    drawTransitionAnimation(centerX, centerY);
    
    if (millis() - transitionStartTime > transitionDuration) {
      showTransition = false;
    }
    return;
  }
  
  // Reset justLeftPause flag after a few frames
  if (justLeftPause) {
    justLeftPauseTimer++;
    if (justLeftPauseTimer > 10) {
      justLeftPause = false;
      justLeftPauseTimer = 0;
    }
  }
  
  // ===== INITIAL PAUSE SCREEN (ACCEPT/REJECT) =====
  if (showPauseScreen && !pauseActive) {
    drawPausePrompt(centerX, centerY);
    return;
  }
  
  // ===== ACTIVE PAUSE SCREEN (COUNTDOWN) =====
  if (pauseActive) {
    drawActivePause(centerX, centerY);
    return;
  }
  
  // ===== CALCULATE POMODORO PROGRESS =====
  let elapsedTime = ((millis() - pomodoroStartTime) / 1000) * speedMultiplier;
  let progress = elapsedTime / pomodoroDuration;
  
  let circleSize = map(progress, 0, 1, 0, 300);
  circleSize = constrain(circleSize, 0, 300);
  
  // Check if reached a pause level
  if (activities[currentActivity].hasPauses && currentLevel < 3 && !justLeftPause) {
    let targetSize = circleTargets[currentLevel];
    if (circleSize >= targetSize && !showPauseScreen) {
      showPauseScreen = true;
      triggerVibration(); // Vibração quando atinge pausa
    }
  }
  
  // If reached 300px circle, switch to next activity
  if (circleSize >= 300) {
    triggerVibration();
    
    showTransition = true;
    transitionStartTime = millis();
    
    currentQuote = random(quotes);
    
    currentActivity = (currentActivity + 1) % activities.length;
    
    currentLevel = 0;
    pomodoroStartTime = millis() + transitionDuration;
    accumulatedPauseTime = pauseDuration;
    pomodoroDuration = activities[currentActivity].duration;
    circleTargets = activities[currentActivity].circleTargets;
  }
  
  // ===== LARGER CIRCLE (300x300) - PINK GRADIENT WITH ORANGE OUTLINE =====
  noStroke();
  for (let r = 150; r > 0; r -= 1) {
    let inter = map(r, 0, 150, 0, 1);
    let c = lerpColor(color(124, 0, 57), color(222, 5, 105), inter);
    fill(c);
    circle(centerX, centerY, r * 2);
  }
  
  noFill();
  strokeWeight(5);
  stroke(241, 154, 62);
  circle(centerX, centerY, 300);
  
  // ===== INNER CIRCLES (ORANGE OUTLINE) =====
  if (activities[currentActivity].hasPauses) {
    noFill();
    strokeWeight(2);
    stroke(241, 154, 62);
    
    circle(centerX, centerY, 225);
    circle(centerX, centerY, 150);
    circle(centerX, centerY, 75);
  }
  
  // ===== GROWING ORANGE CIRCLE (POMODORO) =====
  if (circleSize > 0) {
    noStroke();
    fill(241, 154, 62);
    circle(centerX, centerY, circleSize);
  }
  
  // ===== TIME IN CENTER =====
  let h = hour();
  let m = minute();
  
  noStroke();
  fill(255);
  textFont(fontHoras); // Usar fonte personalizada
  textSize(120);
  textStyle(BOLD);
  
  let hourText = nf(h, 2);
  let minuteText = nf(m, 2);
  
  text(hourText, centerX, centerY - 60);
  text(minuteText, centerX, centerY + 30);
  
  // ===== CURVED TEXTS ON 350PX CIRCLE =====
  let radius = 175;
  
  let activityName = activities[currentActivity].name;
  let nextActivity = activities[currentActivity].next;
  
  // Calculate TOTAL remaining time
  let activityTimeLeft = pomodoroDuration - elapsedTime;
  
  let totalPausesTime = 0;
  if (activities[currentActivity].hasPauses) {
    let pausesRemaining = 3 - currentLevel;
    totalPausesTime = accumulatedPauseTime * 60;
    if (pausesRemaining > 1) {
      totalPausesTime += (pausesRemaining - 1) * pauseDuration * 60;
    }
  }
  
  let totalTimeLeft = activityTimeLeft + totalPausesTime;
  let hours = floor(totalTimeLeft / 3600);
  let minutes = floor((totalTimeLeft % 3600) / 60);
  let timeText = nf(hours, 2) + "h" + nf(minutes, 2);

  // Current activity text on upper left arc
  drawCurvedText(activityName, centerX, centerY, radius, 180, 90, 222, 5, 105, 18);

  // Remaining time on upper right arc
  drawCurvedText(timeText, centerX, centerY, radius, 300, 50, 222, 5, 105, 20);

  // Next activity text on lower arc
  drawCurvedTextBottom(nextActivity, centerX, centerY, radius, 135, 110, 241, 154, 62, 16);
}

// Initial pause screen (accept/reject)
function drawPausePrompt(centerX, centerY) {
  background(0);
  
  noStroke();
  for (let r = 150; r > 0; r -= 1) {
    let inter = map(r, 150, 0, 0, 1);
    let c = lerpColor(color(157, 254, 231), color(5, 115, 89), inter);
    fill(c);
    circle(centerX, centerY, r * 2);
  }
  
  noFill();
  strokeWeight(5);
  stroke(222, 5, 105);
  circle(centerX, centerY, 300);
  
  noStroke();
  fill(255);
  textFont(fontTexto); // Usar fonte personalizada
  textSize(24);
  textStyle(BOLD);
  text("Pausa", centerX, centerY - 60);
  
  textSize(48);
  textStyle(BOLD);
  text(nf(accumulatedPauseTime, 2) + " min", centerX, centerY);
  
  let xIconX = centerX - 40;
  let checkIconX = centerX + 40;
  let iconsY = centerY + 80;
  let iconSize = 40;
  
  // Reset to default font for icons
  textFont('sans-serif');
  
  if (dist(mouseX, mouseY, xIconX, iconsY) < iconSize) {
    fill(222, 5, 105);
  } else {
    fill(255);
  }
  textSize(40);
  text("✕", xIconX, iconsY);
  
  if (dist(mouseX, mouseY, checkIconX, iconsY) < iconSize) {
    fill(222, 5, 105);
  } else {
    fill(255);
  }
  text("✓", checkIconX, iconsY);
}

// Active pause screen (countdown)
function drawActivePause(centerX, centerY) {
  background(0);
  
  let pauseElapsed = ((millis() - pauseStartTime) / 1000) * speedMultiplier;
  let pauseRemaining = (accumulatedPauseTime * 60) - pauseElapsed;
  
  if (pauseRemaining <= 0) {
    triggerVibration();
    
    pauseActive = false;
    currentLevel++;
    accumulatedPauseTime = pauseDuration;
    justLeftPause = true;
    return;
  }
  
  noStroke();
  for (let r = 150; r > 0; r -= 1) {
    let inter = map(r, 150, 0, 0, 1);
    let c = lerpColor(color(157, 254, 231), color(5, 115, 89), inter);
    fill(c);
    circle(centerX, centerY, r * 2);
  }
  
  noFill();
  strokeWeight(5);
  stroke(222, 5, 105);
  circle(centerX, centerY, 300);
  
  noStroke();
  fill(222, 5, 105);
  textFont(fontTexto); // Usar fonte personalizada
  textSize(20);
  textStyle(BOLD);
  text(nf(accumulatedPauseTime, 2) + " min", centerX, centerY - 60);
  
  fill(255);
  textFont(fontHoras); // Usar fonte personalizada para números
  textSize(40);
  textStyle(BOLD);
  let minutes = floor(pauseRemaining / 60);
  let seconds = floor(pauseRemaining % 60);
  text("00:" + nf(minutes, 2) + ":" + nf(seconds, 2), centerX, centerY - 10);
  
  let now = new Date();
  let endTime = new Date(now.getTime() + pauseRemaining * 1000);
  let endHour = endTime.getHours();
  let endMinute = endTime.getMinutes();
  
  fill(222, 5, 105);
  textFont(fontTexto); // Usar fonte personalizada
  textSize(18);
  textStyle(NORMAL);
  text("≈ " + nf(endHour, 2) + "h" + nf(endMinute, 2), centerX, centerY + 40);
  
  let checkIconX = centerX;
  let iconsY = centerY + 90;
  let iconSize = 40;
  
  // Reset to default font for icons
  textFont('sans-serif');
  
  if (dist(mouseX, mouseY, checkIconX, iconsY) < iconSize) {
    fill(222, 5, 105);
  } else {
    fill(255);
  }
  textSize(40);
  text("✓", checkIconX, iconsY);
}

function mousePressed() {
  let centerX = width / 2;
  let centerY = height / 2;
  
  if (showPauseScreen && !pauseActive) {
    let xIconX = centerX - 40;
    let checkIconX = centerX + 40;
    let iconsY = centerY + 80;
    let iconSize = 40;
    
    if (dist(mouseX, mouseY, checkIconX, iconsY) < iconSize) {
      pauseActive = true;
      pauseStartTime = millis();
      showPauseScreen = false;
    }
    
    if (dist(mouseX, mouseY, xIconX, iconsY) < iconSize) {
      accumulatedPauseTime += pauseDuration;
      currentLevel++;
      showPauseScreen = false;
      justLeftPause = true;
    }
  }
  
  else if (pauseActive) {
    let checkIconX = centerX;
    let iconsY = centerY + 90;
    let iconSize = 40;
    
    if (dist(mouseX, mouseY, checkIconX, iconsY) < iconSize) {
      let pauseTimeSpent = (millis() - pauseStartTime) / 1000;
      let currentElapsed = (millis() - pomodoroStartTime) / 1000;
      pomodoroStartTime = millis() - (currentElapsed * 1000);
      
      pauseActive = false;
      currentLevel++;
      accumulatedPauseTime = pauseDuration;
      justLeftPause = true;
    }
  }
}

function keyPressed() {
  if (key === '1') {
    speedMultiplier = 1;
    pomodoroStartTime = millis();
  }
  
  if (key === '2') {
    speedMultiplier = 60;
    pomodoroStartTime = millis();
  }
  
  if (key === '3') {
    speedMultiplier = 300;
    pomodoroStartTime = millis();
  }
  
  if (key === '4') {
    speedMultiplier = 3600;
    pomodoroStartTime = millis();
  }
  
  if (key === 'r' || key === 'R') {
    currentLevel = 0;
    currentActivity = 0;
    pomodoroStartTime = millis();
    showPauseScreen = false;
    pauseActive = false;
    accumulatedPauseTime = pauseDuration;
    justLeftPause = false;
    justLeftPauseTimer = 0;
    pomodoroDuration = activities[currentActivity].duration;
    circleTargets = activities[currentActivity].circleTargets;
    currentQuote = random(quotes);
    showTransition = false;
    speedMultiplier = 1;
  }
}

function triggerVibration() {
  vibrationActive = true;
  vibrationStartTime = millis();
}

function drawTransitionAnimation(centerX, centerY) {
  background(0);
  
  let progress = (millis() - transitionStartTime) / transitionDuration;
  
  let specialMessage = activities[currentActivity].transitionMessage || null;
  let isToSleep = activities[currentActivity].sleepMode || false;
  
  if (isToSleep && specialMessage) {
    let alpha = map(progress, 0, 1, 0, 255);
    
    noStroke();
    for (let r = 150; r > 0; r -= 1) {
      let inter = map(r, 0, 150, 0, 1);
      let c = lerpColor(color(124, 0, 57, 127), color(222, 5, 105, 127), inter);
      fill(c);
      circle(centerX, centerY, r * 2);
    }
    
    noStroke();
    fill(255, alpha);
    textFont(fontTexto); // Usar fonte personalizada
    textSize(28);
    textStyle(BOLD);
    text(specialMessage, centerX, centerY);
    
    return;
  }
  
  let pulseSize = map(sin(progress * PI * 4), -1, 1, 200, 350);
  let alpha = map(progress, 0, 1, 255, 0);
  
  let isNightMode = activities[currentActivity].nightMode || false;
  
  noFill();
  strokeWeight(3);
  
  if (isNightMode) {
    stroke(200, 120, 40, alpha);
  } else {
    stroke(241, 154, 62, alpha);
  }
  circle(centerX, centerY, pulseSize);
  
  if (isNightMode) {
    stroke(180, 5, 90, alpha);
  } else {
    stroke(222, 5, 105, alpha);
  }
  circle(centerX, centerY, pulseSize - 50);
  
  let textAlpha = map(progress, 5, 1, 0, 255);
  noStroke();
  fill(255, textAlpha);
  textFont(fontTexto); // Usar fonte personalizada
  textSize(32);
  textStyle(BOLD);
  text(activities[currentActivity].name.replace("NOW: ", ""), centerX, centerY - 30);
  
  fill(isNightMode ? color(200, 120, 40, textAlpha) : color(241, 154, 62, textAlpha));
  textSize(20);
  textStyle(NORMAL);
  text(currentQuote, centerX, centerY + 30);
  
  fill(255, textAlpha);
  textSize(16);
  text("Get ready...", centerX, centerY + 80);
}

function drawSleepMode(centerX, centerY) {
  background(0);
  
  noStroke();
  for (let r = 150; r > 0; r -= 1) {
    let inter = map(r, 0, 150, 0, 1);
    let c = lerpColor(color(124, 0, 57, 89), color(222, 5, 105, 89), inter);
    fill(c);
    circle(centerX, centerY, r * 2);
  }
  
  let h = hour();
  let m = minute();
  
  noStroke();
  textFont(fontHoras); // Usar fonte personalizada
  fill(255, 255);
  textSize(96);
  textStyle(BOLD);
  
  let horaTexto = nf(h, 2);
  let minutoTexto = nf(m, 2);
  
  text(horaTexto, centerX, centerY - 40);
  text(minutoTexto, centerX, centerY + 55);
  
  let radius = 175;
  
  push();
  translate(centerX, centerY);
  textFont(fontTexto); // Usar fonte personalizada
  fill(255, 255);
  textSize(14);
  textStyle(NORMAL);
  textAlign(CENTER, CENTER);
  
  let topText = "TIME TO SLEEP";
  let topArc = 90;
  let topAnglePerChar = topArc / topText.length;
  let topStart = 90 + (topArc / 2);
  
  for (let i = 0; i < topText.length; i++) {
    push();
    let angle = topStart - (topAnglePerChar * i);
    let angleRad = radians(angle);
    let x = cos(angleRad) * radius;
    let y = sin(angleRad) * radius;
    translate(x, y);
    rotate(angleRad - HALF_PI);
    text(topText[i], 0, 0);
    pop();
  }
  pop();
}

function drawCurvedText(txt, cx, cy, radius, startAngleDeg, arcLength, r, g, b, size) {
  push();
  translate(cx, cy);
  
  textFont(fontTexto);
  textSize(size);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  
  // Calcular espaço necessário baseado no tamanho real da fonte
  let minDegreePerChar = 4.5; // Graus mínimos por caractere para evitar sobreposição
  let neededArc = txt.length * minDegreePerChar;
  
  // Usa o maior valor entre o necessário e o disponível, limitado ao máximo
  let dynamicArc = min(arcLength, max(neededArc, txt.length * 7));
  
  let anglePerChar = dynamicArc / txt.length;
  let startOffset = startAngleDeg + ((arcLength - dynamicArc) / 2);
  
  // Desenhar sombra
  fill(0, 0, 0, 100);
  for (let i = 0; i < txt.length; i++) {
    push();
    let angle = startOffset + (anglePerChar * i) + (anglePerChar / 2);
    let angleRad = radians(angle);
    let x = cos(angleRad) * radius;
    let y = sin(angleRad) * radius;
    translate(x + 2, y + 2);
    rotate(angleRad + HALF_PI);
    text(txt[i], 0, 0);
    pop();
  }
  
  // Desenhar texto principal
  fill(r, g, b);
  for (let i = 0; i < txt.length; i++) {
    push();
    let angle = startOffset + (anglePerChar * i) + (anglePerChar / 2);
    let angleRad = radians(angle);
    let x = cos(angleRad) * radius;
    let y = sin(angleRad) * radius;
    translate(x, y);
    rotate(angleRad + HALF_PI);
    text(txt[i], 0, 0);
    pop();
  }
  
  pop();
}

function drawCurvedTextBottom(txt, cx, cy, radius, startAngleDeg, arcLength, r, g, b, size) {
  push();
  translate(cx, cy);
  
  textFont(fontTexto);
  textSize(size);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  
  // Calcular espaço necessário baseado no tamanho real da fonte
  let minDegreePerChar = 4.5; // Graus mínimos por caractere para evitar sobreposição
  let neededArc = txt.length * minDegreePerChar;
  
  // Usa o maior valor entre o necessário e o disponível, limitado ao máximo
  let dynamicArc = min(arcLength, max(neededArc, txt.length * 7));
  
  let anglePerChar = dynamicArc / txt.length;
  let startOffset = startAngleDeg - ((arcLength - dynamicArc) / 2);
  
  // Desenhar sombra
  fill(0, 0, 0, 100);
  for (let i = 0; i < txt.length; i++) {
    push();
    let angle = startOffset - (anglePerChar * i) - (anglePerChar / 2);
    let angleRad = radians(angle);
    let x = cos(angleRad) * radius;
    let y = sin(angleRad) * radius;
    translate(x + 2, y + 2);
    rotate(angleRad - HALF_PI);
    text(txt[i], 0, 0);
    pop();
  }
  
  // Desenhar texto principal
  fill(r, g, b);
  for (let i = 0; i < txt.length; i++) {
    push();
    let angle = startOffset - (anglePerChar * i) - (anglePerChar / 2);
    let angleRad = radians(angle);
    let x = cos(angleRad) * radius;
    let y = sin(angleRad) * radius;
    translate(x, y);
    rotate(angleRad - HALF_PI);
    text(txt[i], 0, 0);
    pop();
  }
  
  pop();
}