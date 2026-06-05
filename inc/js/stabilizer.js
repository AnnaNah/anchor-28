// ==========================================
// --- VARIABLES D'ÉTAT DU STABILIZER ---
// ==========================================
let currentPhase = 1;
let statusPollingTimer;

// Variables du Simon
let simonSequence = [];      // La séquence générée par la machine
let playerStepIndex = 0;     // Où en est le joueur dans sa réponse
let isSimonPlaying = false;  // Bloque les clics pendant la démo
let roundCount = 0;          // Nombre de manches gagnées

// Configurations
const MAX_ROUNDS_PHASE_1 = 4; // Nombre de séquences à réussir en Phase 1
const MAX_ROUNDS_PHASE_2 = 5; // Nombre de séquences en Phase 2
const PHASE_1_BTNS = [5, 6, 9, 10]; 
const SEED_TYPES = ['ALPHA-7', 'BETA-X', 'OMEGA-3'];
let currentSeed = "";

const DELAY_BEFORE_REPEAT = 5000; // 5 secondes d'inactivité avant répétition
let repeatTimer = null;           // Stocke le chronomètre

// ==========================================
// --- FONCTIONS UTILITAIRES DE LA GRILLE ---
// ==========================================
function currentGridSize() {
    const totalBtns = document.querySelectorAll('.btn').length;
    return Math.sqrt(totalBtns);
}

function getCoordonatesByIndex(index, gridSize = currentGridSize()) {
    return [ Math.trunc(index / gridSize), index % gridSize ];
}

function getIndexByCoordonates(coords = [0, 0], gridSize = currentGridSize()) {
    return (coords[0] * gridSize) + coords[1];
}

// Sécurisation de l'affichage visuel du HUD
function blink(success = false, blinkTime = 2) {
    const classOfPrestige = success ? 'success' : 'wrong';
    const container = document.querySelector('.container');
    const ANIMATION_DURATION = 300;

    container.classList.remove('success', 'wrong');
    // Force un petit reflow pour relancer l'animation si elle tournait déjà
    void container.offsetWidth; 
    container.classList.add(classOfPrestige);
    
    if (blinkTime > 0) {
        setTimeout(() => {
            container.classList.remove(classOfPrestige);
        }, (2 * ANIMATION_DURATION) * blinkTime);
    }
}

// ==========================================
// --- LE CERVEAU DU PUZZLE (TRADUCTEUR) ---
// ==========================================
function getExpectedButton(flashedIndex, seed, phase) {
    // Nettoyage de la SEED
    const hex = seed.substring(2); 
    const letters = hex.match(/[A-F]/g) || []; 
    const numbers = hex.match(/[0-9]/g) || []; 
    const firstChar = hex[0];
    const lastChar = hex[7];

    if (phase === 1) {
        // RÈGLE 1 : Si la SEED commence par 'F'
        if (firstChar === 'F') return flashedIndex; 
        
        // RÈGLE 2 : Contient '77' -> Rotation Horaire
        else if (hex.includes('77')) return {5:6, 6:10, 10:9, 9:5}[flashedIndex];
        
        // RÈGLE 3 : Plus de lettres que de chiffres -> Inversion Diagonale
        else if (letters.length > numbers.length) return {5:10, 10:5, 6:9, 9:6}[flashedIndex];
        
        // RÈGLE 4 : Contient 'A' et 'B' -> Inversion Horizontale
        else if (hex.includes('A') && hex.includes('B')) return {5:6, 6:5, 9:10, 10:9}[flashedIndex];
        
        // RÈGLE 5 : Finit par chiffre pair -> Inversion Verticale
        else if (['0', '2', '4', '6', '8'].includes(lastChar)) return {5:9, 9:5, 6:10, 10:6}[flashedIndex];
        
        // RÈGLE 6 : Défaut -> Rotation Anti-horaire
        else return {5:9, 9:10, 10:6, 6:5}[flashedIndex];
    }
    
    else if (phase === 2) {
        // --- NOUVELLES RÈGLES 4x4 (16 BOUTONS) ---
        // On calcule la ligne (row) et la colonne (col) du bouton allumé (de 0 à 3)
        const row = Math.floor(flashedIndex / 4);
        const col = flashedIndex % 4;

        // RÈGLE 1 : Si la SEED commence par '00'
        if (hex.startsWith('00')) {
            return flashedIndex; 
        }
        // RÈGLE 2 : Si la SEED contient 'FF'
        else if (hex.includes('FF')) {
            return 15 - flashedIndex;
        }
        // RÈGLE 3 : Si la SEED contient '42'
        else if (hex.includes('42')) {
            const swap42 = {0:5, 5:0, 3:6, 6:3, 12:9, 9:12, 15:10, 10:15};
            return swap42[flashedIndex] !== undefined ? swap42[flashedIndex] : flashedIndex;
        }
        // RÈGLE 4 : Plus de LETTRES que de CHIFFRES
        else if (letters.length > numbers.length) {
            return row * 4 + (3 - col);
        }
        // RÈGLE 5 : Plus de CHIFFRES que de LETTRES
        else if (numbers.length > letters.length) {
            return (3 - row) * 4 + col;
        }
        // RÈGLE 6 : Si contient à la fois 'A' et 'E'
        else if (hex.includes('A') && hex.includes('E')) {
            return row * 4 + ((col + 1) % 4);
        }
        // RÈGLE 7 : Si le dernier caractère est un CHIFFRE IMPAIR
        else if (['1', '3', '5', '7', '9'].includes(lastChar)) {
            return ((row + 1) % 4) * 4 + col;
        }
        // RÈGLE 8 : Cas par défaut
        else {
            return flashedIndex % 2 === 0 ? flashedIndex + 1 : flashedIndex - 1;
        }
    }
}

// Génère une clé hexadécimale de 8 caractères
function generateHexSeed() {
    const chars = '0123456789ABCDEF';
    let hex = '';
    for (let i = 0; i < 8; i++) {
        hex += chars[Math.floor(Math.random() * 16)];
    }
    return '0x' + hex;
}

// ==========================================
// --- LA BOUCLE DE JEU SIMON ---
// ==========================================
function startNewRound() {
    playerStepIndex = 0;
    
    // Choix du nouveau bouton
    const availableBtns = (currentPhase === 1) ? PHASE_1_BTNS : Array.from({length: 16}, (_, i) => i);
    const randomBtn = availableBtns[Math.floor(Math.random() * availableBtns.length)];
    simonSequence.push(randomBtn);
    
    // Génération et affichage de la clé
    const screen = document.querySelector('#hint-screen');
    currentSeed = generateHexSeed(); // La clé est générée à TOUTES les phases maintenant !
    
    if (currentPhase === 1) {
        screen.innerHTML = `<span class="cyan" style="color: #00ffff; text-shadow: 0 0 10px #00ffff;">${currentSeed}</span>`;
    } else {
        // En phase 2, on passe en mode Override (Rouge Alerte)
        screen.innerHTML = `<span class="red" style="color: #ff002b; text-shadow: 0 0 10px #ff002b;">${currentSeed}</span>`;
    }
    
    playSequence();
}

async function playSequence() {
    isSimonPlaying = true;
    clearTimeout(repeatTimer); // SÉCURITÉ : On coupe le chrono si la machine joue
    
    // Petite pause pour laisser le temps au joueur de se préparer
    await new Promise(r => setTimeout(r, 1000));
    
    for (let i = 0; i < simonSequence.length; i++) {
        const btnIndex = simonSequence[i];
        const btnWrapper = document.getElementById(btnIndex);
        const btnEl = btnWrapper.querySelector('button');
        
        btnEl.classList.add('clicked'); 
        await new Promise(r => setTimeout(r, 400)); 
        btnEl.classList.remove('clicked');
        await new Promise(r => setTimeout(r, 200)); 
    }
    
    isSimonPlaying = false; // C'est au tour du joueur !
    
    // NOUVEAU : On lance le compte à rebours d'inactivité !
    repeatTimer = setTimeout(() => {
        playerStepIndex = 0; // On force le joueur à reprendre du début
        playSequence();      // On rejoue la séquence visuelle
    }, DELAY_BEFORE_REPEAT);
}

function handlePlayerClick(btnId) {
    if (isSimonPlaying) return; // On ne clique pas pendant que Simon parle !
    
    // NOUVEAU : Le joueur a touché un bouton, on coupe la répétition automatique !
    clearTimeout(repeatTimer); 
    
    const expectedFlashed = simonSequence[playerStepIndex];
    const expectedTarget = getExpectedButton(expectedFlashed, currentSeed, currentPhase);
    
    if (btnId === expectedTarget) {
        // --- BONNE RÉPONSE ---
        playerStepIndex++;
        
        if (playerStepIndex === simonSequence.length) {
            // Séquence complète réussie !
            roundCount++;
            blink(true, 1); 
            isSimonPlaying = true; 
            
            if (currentPhase === 1 && roundCount >= MAX_ROUNDS_PHASE_1) {
                winPhase1();
            } 
            else if (currentPhase === 2 && roundCount >= MAX_ROUNDS_PHASE_2) {
                winPhase2();
            } 
            else {
                setTimeout(startNewRound, 1000);
            }
        } else {
            // NOUVEAU : Le joueur a bon, mais n'a pas fini la séquence. 
            // On lui laisse à nouveau DELAY_BEFORE_REPEAT secondes pour cliquer sur le suivant !
            repeatTimer = setTimeout(() => {
                playerStepIndex = 0;
                playSequence();
            }, DELAY_BEFORE_REPEAT);
        }
    } else {
        // --- MAUVAISE RÉPONSE ---
        blink(false, 2); 
        simonSequence = []; 
        roundCount = 0; 
        isSimonPlaying = true;
        
        document.querySelector('#hint-screen').innerHTML = `<span style="color: #ff002b;">SEQUENCE FAILED</span>`;
        setTimeout(startNewRound, 1500);
    }
}


// ==========================================
// --- GESTION DES PHASES ET DE L'API ---
// ==========================================
async function checkStabilizerStatus() {
    try {
        const response = await fetch('/inc/php/check_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module: 'stabilizer' })
        });
        
        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();
        
        if (data.status === 'rebooting' || data.status === 'online') {
            clearInterval(statusPollingTimer);
            startPhase2();
        }
    } catch (err) {
        console.error("[SYS] Erreur de synchronisation avec le noyau :", err);
    }
}

function winPhase1() {
    document.querySelector('#hint-screen').innerHTML = "AWAITING SYSTEM OVERRIDE";
    isSimonPlaying = true; // Empêche de cliquer partout
    
    // Lancement du Radar vers le Terminal
    statusPollingTimer = setInterval(checkStabilizerStatus, 2000);
}

function startPhase2() {
    currentPhase = 2;
    roundCount = 0;
    simonSequence = [];
    
    // On débloque TOUS les boutons physiquement ! (la classe disabled lève le cache en carbone)
    document.querySelectorAll('.btn').forEach(b => b.classList.remove('disabled'));
    
    // On lance le premier tour de la Phase 2
    setTimeout(startNewRound, 1000);
}

function winPhase2() {
    document.querySelector('#hint-screen').innerHTML = "STABILIZER FULLY ONLINE";
    isSimonPlaying = true; 
    blink(true, 3);
}

// ==========================================
// --- INITIALISATION ---
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    
    // Attache l'événement de clic à chaque bouton physique
    document.querySelectorAll('.btn > button').forEach(btnEl => {
        btnEl.addEventListener('click', (e) => {
            const wrapperDiv = e.target.closest('.btn');
            if (wrapperDiv.classList.contains('disabled')) return; // Ignore si le cache est baissé
            
            const btnId = parseInt(wrapperDiv.id);
            handlePlayerClick(btnId);
        });
    });

    // On vérifie discrètement le statut de l'Arche au chargement de la page
    try {
        const response = await fetch('/inc/php/check_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module: 'stabilizer' })
        });
        
        const data = await response.json();
        
        if (data.status === 'rebooting' || data.status === 'online') {
            startPhase2();
        } else {
            startNewRound();
        }
    } catch (err) {
        startNewRound(); // En cas de problème serveur, on lance la Phase 1 par défaut
    }
});