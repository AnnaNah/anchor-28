// --- VARIABLES D'ÉTAT ---
let charge = 0;            // % de charge
let currentAnswer = null;   // Réponse au calcul
let playerInput = "";       // Saisie en cours
let crankRotation = 0;      // Angle de la roue de manivelle

// NOUVEAUTÉS POUR LA PROGRESSION
let questionsSolved = 0;
// On récupère automatiquement le nombre de questions via le nombre de dots
const MAX_QUESTIONS = document.querySelectorAll('.progress-bar .dot').length;
// On prépare la variable pour le chrono
let decayTimer;

// --- ÉLÉMENTS DOM ---
const needle = document.querySelector('#gauge-needle');
const crankWheel = document.querySelector('#crank-wheel');
const calcExpression = document.querySelector('#calc-expression');
const calcInput = document.querySelector('#calc-input');

// --- VARIABLES DE SEUIL CRITIQUE ---
const KEYPAD_CRITICAL_THRESHOLD = 0; // En dessous de 20%, le clavier se coupe !
const ENT_CRITICAL_THRESHOLD = 10; // En dessous de 20%, le clavier se coupe !

// --- VARIABLES D'ÉQUILIBRAGE ---
const RECHARGE_RATIO = 0.1;
const DISCHARGE_SPEED = 2;
const LCD_OPACITY_POWER = 2;
const ENERGY_ADDED_FOR_RIGHT_ANSWER = 0;
const ENERGY_REMOVED_FOR_FALSE_ANSWER = 15;

// --- 1. GESTION DE LA JAUGE ---
function updateGauge() {
    charge = Math.max(0, Math.min(100, charge));
    
    // 1. Mise à jour de l'aiguille (ton code parfait)
    const angle = (charge * 1.5) - 75; 
    needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;

    // 2. DYNAMIC VISIBILITY : L'écran s'éteint proportionnellement à la charge
    // Si charge = 100%, opacity = 1. Si charge = 0%, opacity = 0 (extinction totale).
    const lcdScreen = document.querySelector('.lcd-screen');
    if (lcdScreen) {
        lcdScreen.style.opacity = Math.pow(charge / 100, LCD_OPACITY_POWER);
    }

    // 3. VERROUILLAGE DU KEYPAD
    const keypad = document.querySelector('.keypad');
    if (keypad) {
        if (charge < KEYPAD_CRITICAL_THRESHOLD) {
            keypad.classList.add('disabled'); // Le CSS prend le relais et bloque tout
                keypad.classList.add('disabled'); // Le CSS prend le relais et bloque tout
        } else {
            keypad.classList.remove('disabled'); // Système opérationnel !
        }
    }
}

// La décharge passive (1% toutes les 400ms)
decayTimer =  setInterval(() => {
    charge -= DISCHARGE_SPEED;
    updateGauge();
}, 400);

// --- 2. LA MANIVELLE MÉCANIQUE ---
// function turnCrank() {
//     // Fait tourner la roue de 45 degrés à chaque clic
//     crankRotation += 45;
//     crankWheel.style.transform = `rotate(${crankRotation}deg)`;
    
//     // Ajoute de l'énergie
//     charge += 8;z
//     updateGauge();
// }

// --- 3. L'ÉCRAN DE CALCUL ---
function generateCalculus() {
    const num1 = Math.floor(Math.random() * 12) + 1;
    const num2 = Math.floor(Math.random() * 12) + 1;
    currentAnswer = num1 * num2;
    calcExpression.textContent = `${num1} x ${num2} = ?`;
}

// --- 4. LE KEYPAD ---
function pressKey(key) {
    if (key === 'C') {
        playerInput = "";
    } else if (key === 'E') {
        validateAnswer();
    } else {
        if (playerInput.length < 3) playerInput += key;
    }
    
    calcInput.textContent = playerInput || "_";
}

function validateAnswer() {
    
    if (charge > ENT_CRITICAL_THRESHOLD) {

        if (parseInt(playerInput) === currentAnswer) {
            // Succès !
            charge += ENERGY_ADDED_FOR_RIGHT_ANSWER;
            playerInput = "";
            questionsSolved++; // On ajoute un point !
            
            updateProgress(); // On allume la diode !
            
            // --- CONDITION DE VICTOIRE ---
            if (questionsSolved >= MAX_QUESTIONS) {
                clearInterval(decayTimer); // On arrête la décharge !
                charge = 100;
                updateGauge();
                document.querySelector('.keypad').classList.add('disabled'); // Le CSS prend le relais et bloque tout
                
                // On affiche un message de victoire sur l'écran LCD
                calcExpression.textContent = "SYSTEM ONLINE";
                document.querySelector('.lcd-screen').style.opacity = 1; // On force la lumière
                
                // On verrouille tout le module (ajoute la classe locked)
                document.querySelector('.container').classList.add('locked');
                return; // On stoppe la fonction ici
            }
    
            generateCalculus(); 
            
            calcInput.style.color = "#fff";
            setTimeout(() => calcInput.style.color = "#39ff14", 200);
        } else {
            // Erreur
            charge -= ENERGY_REMOVED_FOR_FALSE_ANSWER; 
            playerInput = "";
            
            calcInput.style.color = "#ff002b";
            setTimeout(() => calcInput.style.color = "#39ff14", 200);
        }
        
        updateGauge();
        calcInput.textContent = "_";
        
        shuffleKeypad();
    }
}

// --- 5. PHYSIQUE DE LA MANIVELLE ROTATIVE ---
let isDragging = false;
let previousAngle = 0;

// Fonction mathématique pour trouver l'angle (en degrés) entre le centre et la souris
function getAngle(x, y) {
    const rect = crankWheel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Math.atan2 donne l'angle en radians, on le convertit en degrés
    return Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
}

// Quand on attrape la manivelle (clic ou doigt)
function startDrag(e) {
    isDragging = true;
    
    // Récupère les coordonnées (gère la souris ET le tactile)
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    previousAngle = getAngle(clientX, clientY);
}

// Quand on tourne (mouvement)
function doDrag(e) {
    if (!isDragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const currentAngle = getAngle(clientX, clientY);
    
    // Calcul de la différence d'angle depuis le dernier mouvement
    let deltaAngle = currentAngle - previousAngle;
    
    // Correction si on passe la barre des -180° / +180° (le point zéro de atan2)
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;
    
    // On applique la rotation visuelle à la roue
    crankRotation += deltaAngle;
    crankWheel.style.transform = `rotate(${crankRotation}deg)`;
    
    // RECHARGE DE LA JAUGE : Seulement si on tourne dans le sens horaire (deltaAngle positif)
    // Le multiplicateur (0.08) règle la difficulté. Plus il est bas, plus il faut faire de tours !
    if (deltaAngle > 0) {
        charge += (deltaAngle / 5) * RECHARGE_RATIO;
        updateGauge();
    }
    
    previousAngle = currentAngle;
}

// Quand on lâche
function endDrag() {
    isDragging = false;
}

// --- 6. LE CHAOS (SHUFFLE DU KEYPAD) ---
function shuffleKeypad() {
    const keypad = document.querySelector('.keypad');
    if (!keypad) return;

    // On récupère absolument toutes les touches
    const allKeys = Array.from(keypad.querySelectorAll('.key'));
    
    // On isole les boutons d'action (CLR et ENT) pour qu'ils restent à leur place
    const btnClear = allKeys.find(btn => btn.classList.contains('btn-clear'));
    const btnEnter = allKeys.find(btn => btn.classList.contains('btn-enter'));
    
    // On isole les 10 touches de chiffres
    const numKeys = allKeys.filter(btn => !btn.classList.contains('btn-clear') && !btn.classList.contains('btn-enter'));

    // Algorithme de Fisher-Yates pour mélanger les chiffres aléatoirement
    for (let i = numKeys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numKeys[i], numKeys[j]] = [numKeys[j], numKeys[i]];
    }

    // On vide physiquement la grille du clavier
    keypad.innerHTML = '';

    // On reconstruit la grille avec le nouvel ordre
    // 1. On place les 9 premiers chiffres mélangés (les 3 premières lignes)
    for(let i = 0; i < 9; i++) {
        keypad.appendChild(numKeys[i]);
    }
    
    // 2. On place la dernière ligne : CLR, le 10ème chiffre, et ENT
    keypad.appendChild(btnClear);
    keypad.appendChild(numKeys[9]);
    keypad.appendChild(btnEnter);
}

function updateProgress() {
    const dots = document.querySelectorAll('.progress-bar .dot');
    dots.forEach((dot, index) => {
        if (index < questionsSolved) {
            dot.classList.add('solved');
        }
    });
}

// --- ÉCOUTEURS D'ÉVÉNEMENTS (SOURIS) ---
crankWheel.addEventListener('mousedown', startDrag);
document.addEventListener('mousemove', doDrag);
document.addEventListener('mouseup', endDrag);

// --- ÉCOUTEURS D'ÉVÉNEMENTS (MOBILE / TACTILE) ---
crankWheel.addEventListener('touchstart', startDrag, { passive: false });
document.addEventListener('touchmove', doDrag, { passive: false });
document.addEventListener('touchend', endDrag);

// --- INITIALISATION ---
document.addEventListener("DOMContentLoaded", () => {
    updateGauge();
    generateCalculus();
    shuffleKeypad(); // Les chiffres sont aléatoires dès le début !
});