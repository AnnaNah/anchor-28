// --- VARIABLES D'ÉTAT ---
let charge = 0;            // % de charge
let currentAnswer = null;   // Réponse au calcul
let playerInput = "";       // Saisie en cours
let crankRotation = 0;      // Angle de la roue de manivelle

// NOUVELLES VARIABLES POUR LES PHASES
let currentPhase = 1;       // Pour savoir dans quelle phase on se trouve
let statusPollingTimer;     // Le chronomètre de notre boucle de vérification

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
const VICTORY_FIRST_SENTENCE = "ENERGY RESTORED";

// --- 1. GESTION DE LA JAUGE ---
function updateGauge() {
    if (questionsSolved < MAX_QUESTIONS) {

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
            } else {
                keypad.classList.remove('disabled'); // Système opérationnel !
            }
        }
    } else {

        charge = 100;

        // 1. Mise à jour de l'aiguille (ton code parfait)
        const angle = (charge * 1.5) - 75; 
        needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;

        // 2. DYNAMIC VISIBILITY : L'écran s'éteint proportionnellement à la charge
        // Si charge = 100%, opacity = 1. Si charge = 0%, opacity = 0 (extinction totale).
        const lcdScreen = document.querySelector('.lcd-screen');
        if (lcdScreen) {
            lcdScreen.style.opacity = Math.pow(charge / 100, LCD_OPACITY_POWER);
        }
    }
}

async function checkGeneratorStatus() {
    try {
        // Requête POST avec le module dans le body
        const response = await fetch('/inc/php/check_status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                module: 'generator' // C'est ici qu'on précise le module !
            })
        });
        
        if (!response.ok) throw new Error('Erreur réseau HTTP');
        
        const data = await response.json();
        
        if (data.status === 'rebooting' || data.status === 'online') {
            clearInterval(statusPollingTimer); 
            startPhase2();
        }
    } catch (err) {
        console.error("[SYS] Erreur de synchronisation avec le noyau :", err);
    }
}

function startPhase2() {
    currentPhase = 2; // On passe officiellement au niveau supérieur
    questionsSolved = 0; // On remet le score à zéro
    
    // On éteint toutes les diodes de la progress bar
    const dots = document.querySelectorAll('.progress-bar .dot');
    dots.forEach(dot => dot.classList.remove('solved'));
    
    // On déverrouille l'interface visuellement
    document.querySelector('.container').classList.remove('locked');
    document.querySelector('.keypad').classList.remove('disabled');
    
    // On relance la fuite d'énergie !
    decayTimer = setInterval(() => {
        charge -= DISCHARGE_SPEED;
        updateGauge();
    }, 400);
    
    // On génère la première énigme hardcore avec X
    generatePhase2Calculus();
}

// La décharge passive (1% toutes les 400ms)
decayTimer =  setInterval(() => {
    charge -= DISCHARGE_SPEED;
    updateGauge();
}, 400);

function determineX(numbers, operators) {
    // --- 1. PRÉPARATION DES DONNÉES ---
    const sum = numbers.reduce((a, b) => a + b, 0);
    const minNum = Math.min(...numbers);
    const maxNum = Math.max(...numbers);
    const allEven = numbers.every(n => n % 2 === 0);
    const firstNumEven = numbers[0] % 2 === 0;

    const countAdd = operators.filter(o => o === '+').length;
    const countSub = operators.filter(o => o === '-').length;
    const countMul = operators.filter(o => o === '*').length;
    const countDiv = operators.filter(o => o === '/').length;
    const allOpsIdentical = operators.every(o => o === operators[0]);

    const hasNum = (n) => numbers.includes(n);

    // Vérification de 3 chiffres identiques
    const isThreeIdentical = numbers[0] === numbers[1] && numbers[1] === numbers[2];
    const identicalNum = isThreeIdentical ? numbers[0] : null;

    // --- 2. CASCADE DES RÈGLES (Ordre de priorité absolu) ---

    // Règle 1 : S'il y a un 5
    if (hasNum(5)) {
        if (countSub === 2) return 10 - minNum;
        if (countAdd === 1 && countDiv === 1) return 15;
        return 5;
    }
    
    // Règle 2 : S'il n'y a que des chiffres pairs (hors x)
    else if (allEven) {
        if (countDiv >= 1) return Math.floor(maxNum / 2); // Math.floor pour forcer un entier
        if (countAdd >= 2) return 42;
        return 2;
    }
    
    // Règle 3 : S'il y a à la fois une division et une soustraction
    else if (countDiv >= 1 && countSub >= 1) {
        if (firstNumEven) return 6;
        if (sum % 3 === 0) return sum / 3;
        return 12;
    }
    
    // Règle 4 : Si la somme des chiffres est exactement égale à 13
    else if (sum === 13) {
        if (countAdd === 0) return 13;
        if (hasNum(7)) return 7 * 2;
        return 3;
    }
    
    // Règle 5 : S'il y a un 0
    else if (hasNum(0)) {
        if (countMul >= 1) return 1;
        if (sum % 2 !== 0) return sum * 3;
        return 9;
    }
    
    // Règle 6 : S'il y a 3 chiffres identiques (hors x)
    else if (isThreeIdentical) {
        if (countMul >= 1) return identicalNum + 10;
        if (countAdd >= 1) return identicalNum * 3;
        return 0;
    }
    
    // Règle 7 : S'il n'y a ni addition ni soustraction (uniquement * et /)
    else if (countAdd === 0 && countSub === 0) {
        if (numbers.some(n => n > 10)) return 5;
        if (sum % 2 === 0) return 8;
        return 11;
    }
    
    // Règle 8 : S'il y a un 7 et un 2
    else if (hasNum(7) && hasNum(2)) {
        if (countAdd === 2) return 7 + 2;
        if (countSub >= 1) return 7 - 2;
        return 14;
    }
    
    // Règle 9 : Si la somme des chiffres est < 6
    else if (sum < 6) {
        if (countMul === 2) return 100;
        if (hasNum(1)) return maxNum * 4;
        return 0;
    }
    
    // Règle 10 : Si tous les opérateurs sont identiques
    else if (allOpsIdentical) {
        if (operators[0] === '+') return sum - 5;
        if (operators[0] === '*') return 2;
        return 1;
    }
    
    // Fallback de sécurité si aucune règle ne s'applique (Cas Standard)
    return 10;
}

// --- 3. L'ÉCRAN DE CALCUL ---
function generateCalculus() {
    const ops = ['+', '-', '*', '/'];
    let num1, num2, num3, op1, op2, result;
    
    // On boucle jusqu'à ce qu'on trouve une équation qui respecte nos règles
    while (true) {
        num1 = Math.floor(Math.random() * 11) + 1;
        num2 = Math.floor(Math.random() * 11) + 1;
        num3 = Math.floor(Math.random() * 11) + 1;
        
        op1 = ops[Math.floor(Math.random() * ops.length)];
        op2 = ops[Math.floor(Math.random() * ops.length)];
        
        // SÉCURITÉ 1 : On s'assure que les divisions tombent juste mentalement
        let isClean = true;
        if (op1 === '/' && num1 % num2 !== 0) isClean = false;
        if (op2 === '/') {
            if (op1 === '+' || op1 === '-') {
                if (num2 % num3 !== 0) isClean = false;
            } else if (op1 === '*') {
                if ((num1 * num2) % num3 !== 0) isClean = false;
            } else if (op1 === '/') {
                if ((num1 / num2) % num3 !== 0) isClean = false;
            }
        }
        
        // Si l'équation est mentalement "propre", on la calcule
        if (isClean) {
            // L'astuce magique (et sécurisée) de JS pour calculer une chaîne de caractères
            const expr = `${num1} ${op1} ${num2} ${op2} ${num3}`;
            result = new Function(`return ${expr}`)();
            
            // SÉCURITÉ 2 & 3 : Le résultat final doit être un entier positif (pas de virgule, pas de "moins")
            if (Number.isInteger(result) && result >= 0) {
                
                // On remplace les signes informatiques par de jolis signes mathématiques
                const displayOp1 = op1 === '*' ? 'x' : (op1 === '/' ? '÷' : op1);
                const displayOp2 = op2 === '*' ? 'x' : (op2 === '/' ? '÷' : op2);
                
                // On applique à l'écran
                calcExpression.textContent = `${num1} ${displayOp1} ${num2} ${displayOp2} ${num3} = ?`;
                currentAnswer = result;
                
                // On sort de la boucle !
                break; 
            }
        }
    }
}

// --- L'ÉCRAN DE CALCUL (PHASE 2) ---
function generatePhase2Calculus() {
    const ops = ['+', '-', '*', '/'];
    
    while (true) {
        // On génère 3 chiffres de 0 à 12
        const n1 = Math.floor(Math.random() * 11) + 1;
        const n2 = Math.floor(Math.random() * 11) + 1;
        const n3 = Math.floor(Math.random() * 11) + 1;
        
        // On génère 3 opérateurs
        const o1 = ops[Math.floor(Math.random() * ops.length)];
        const o2 = ops[Math.floor(Math.random() * ops.length)];
        const o3 = ops[Math.floor(Math.random() * ops.length)];
        
        // On trouve X selon le manuel
        const xValue = determineX([n1, n2, n3], [o1, o2, o3]);
        
        // L'astuce magique : On force JS à évaluer notre énorme équation textuelle
        // Ordre d'affichage : N1 [o1] N2 [o2] N3 [o3] X = ?
        const expr = `${n1} ${o1} ${n2} ${o2} ${n3} ${o3} ${xValue}`;
        
        // On utilise un try/catch pour attraper les rares erreurs bizarres (comme une division par 0)
        try {
            // JS évalue la chaîne de caractères mathématique !
            // L'opérateur de précédence classique s'applique (* et / avant + et -)
            const result = new Function(`return ${expr}`)();
            
            // SÉCURITÉ : Le résultat final doit être un entier positif (pas de 4.25 ou de -12)
            // On vérifie aussi que le résultat n'est pas "Infinity" (division par 0)
            if (Number.isFinite(result) && Number.isInteger(result) && result >= 0) {
                
                // Formatage esthétique des signes
                const cleanOps = [o1, o2, o3].map(op => op === '*' ? 'x' : (op === '/' ? '÷' : op));
                
                // On affiche X, on garde la vraie valeur secrète
                calcExpression.textContent = `${n1} ${cleanOps[0]} ${n2} ${cleanOps[1]} ${n3} ${cleanOps[2]} x = ?`;
                currentAnswer = result;
                
                // Petit log de triche pour t'aider à tester sans brûler ton cerveau
                console.log(`[PHASE 2] Valeur secrète X = ${xValue}`);
                console.log(`[PHASE 2] Calcul réel : ${expr} = ${result}`);
                
                break; // Équation parfaite trouvée, on casse la boucle !
            }
        } catch (e) {
            // Si la formule plante (division par 0 etc.), la boucle while va juste en relancer une autre.
            continue;
        }
    }
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
            questionsSolved++; 
            
            updateProgress(); 
            
            // --- CONDITION DE VICTOIRE ---
            if (questionsSolved >= MAX_QUESTIONS) {
                clearInterval(decayTimer); // On arrête la décharge !
                charge = 100;
                updateGauge();
                document.querySelector('.keypad').classList.add('disabled'); 
                document.querySelector('.container').classList.add('locked');
                
                if (currentPhase === 1) {
                    // FIN DE PHASE 1 : On attend le Terminal
                    calcExpression.textContent = "AWAITING SYSTEM OVERRIDE";
                    document.querySelector('.lcd-screen').style.opacity = 1; 
                    
                    // On lance le radar : vérification PHP toutes les 2 secondes
                    statusPollingTimer = setInterval(checkGeneratorStatus, 2000);
                } 
                else if (currentPhase === 2) {
                    // FIN DE PHASE 2 : Victoire totale
                    calcExpression.textContent = "SYSTEM FULLY ONLINE";
                    document.querySelector('.lcd-screen').style.opacity = 1; 
                }
                
                return; // On stoppe la fonction ici
            }
    
            // Suite du jeu normal : on génère selon la phase
            if (currentPhase === 1) {
                generateCalculus(); 
            } else {
                generatePhase2Calculus(); 
            }
            
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
document.addEventListener("DOMContentLoaded", async () => {
    updateGauge();
    shuffleKeypad(); 

    // On vérifie discrètement le statut de l'Arche au chargement de la page
    try {
        const response = await fetch('/inc/php/check_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module: 'generator' })
        });
        
        const data = await response.json();
        
        // Si le terminal a déjà validé la commande ROOTMOD, on saute direct en Phase 2 !
        if (data.status === 'rebooting' || data.status === 'online') {
            currentPhase = 2; // On met à jour la variable manuellement pour le refresh
            generatePhase2Calculus();
        } else {
            // Sinon, fonctionnement normal, on lance la Phase 1
            generateCalculus();
        }
    } catch (err) {
        // Sécurité : si le serveur PHP ne répond pas, on lance quand même le jeu en Phase 1
        console.error("Impossible de vérifier l'état au démarrage.", err);
        generateCalculus();
    }
});