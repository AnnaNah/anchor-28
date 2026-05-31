const svg = document.getElementById("cable-svg");
const container = svg.parentElement;

let activeCable = null; // Stocke le câble en cours de dessin
let connections = [];  // Stocke les connexions validées (max 3)

let numberOfCables = 1;

// --- FONCTIONS UTITILES ---

// Récupère les coordonnées du centre d'un point (dot) par rapport au conteneur parent
function getDotCenter(dot) {
    // Récupération de la position brute du coin supérieur gauche par rapport au conteneur parent
    const dotX = dot.offsetLeft;
    const dotY = dot.offsetTop;

    // Récupération de la taille réelle (largeur / hauteur) du point
    const width = dot.offsetWidth;
    const height = dot.offsetHeight;

    // Calcul du centre parfait
    return {
        x: dotX + (width / 2),
        y: dotY + (height / 2)
    };
}

// Supprime un câble existant (gère l'ID d'entrée ou de sortie)
function removeCable(dotId) {
    connections = connections.filter(conn => {
        if (conn.from === dotId || conn.to === dotId) {
            
            // 1. On applique la classe CSS d'animation
            conn.element.classList.add("rewinding");
            
            // 2. On capture l'élément dans une variable locale pour le setTimeout
            const cableToDelete = conn.element;
            
            // 3. On attend 250ms (le temps de l'animation CSS) avant de le détruire du HTML
            setTimeout(() => {
                cableToDelete.remove();
            }, 250);

            return false; // On le retire immédiatement du tableau pour libérer la place
        }
        return true;
    });
}

// Trouve quel élément est sous le doigt/la souris lors du glisser
function getElementFromEvent(e) {
    const touch = e.touches ? e.touches[0] : e;
    return document.elementFromPoint(touch.clientX, touch.clientY);
}

// --- GESTION DES ÉVÉNEMENTS (START) ---

function startDrawing(e, dot, type) {
    e.preventDefault();
    const dotId = dot.getAttribute("data-id");
    
    // Si ce point a déjà un fil connecté, on le supprime
    removeCable(dotId);
    
    // Limite stricte de x câbles max au total
    if (connections.length >= numberOfCables) return;
    
    const coords = getDotCenter(dot);
    
    // Création de la ligne SVG temporaire
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", coords.x);
    line.setAttribute("y1", coords.y);
    line.setAttribute("x2", coords.x);
    line.setAttribute("y2", coords.y);
    line.setAttribute("stroke", "#ff6a00"); // Orange électrique
    // line.setAttribute("stroke-width", "4");
    svg.appendChild(line);
    
    // On mémorise l'ID de départ ET son type (input ou output)
    activeCable = {
        element: line,
        startId: dotId,
        startType: type, 
        startX: coords.x,
        startY: coords.y
    };
}

// --- GESTION DES ÉVÉNEMENTS (MOVE) ---

function moveDrawing(e) {
    if (!activeCable) return;
    
    const containerRect = container.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    
    const currentX = touch.clientX - containerRect.left;
    const currentY = touch.clientY - containerRect.top;
    
    activeCable.element.setAttribute("x2", currentX);
    activeCable.element.setAttribute("y2", currentY);
}

// --- GESTION DES ÉVÉNEMENTS (END) ---

function endDrawing(e) {
    if (!activeCable) return;
    
    const targetEl = getElementFromEvent(e);
    
    if (targetEl) {
        const isInputTarget = targetEl.classList.contains("input-dot");
        const isOutputTarget = targetEl.classList.contains("output-dot");
        
        // SÉCURITÉ 1 : On vérifie qu'on lâche bien sur un point opposé au départ
        if ((activeCable.startType === "input" && isOutputTarget) || 
            (activeCable.startType === "output" && isInputTarget)) {
            
            const targetId = targetEl.getAttribute("data-id");
            
            // Détermination automatique de qui est l'input (from) et qui est l'output (to)
            const inputId = activeCable.startType === "input" ? activeCable.startId : targetId;
            const outputId = activeCable.startType === "output" ? activeCable.startId : targetId;
            
            // SÉCURITÉ 2 : On vérifie que ni cet input ni cet output ne sont déjà pris
            const isPairTaken = connections.some(conn => conn.from === inputId || conn.to === outputId);
            
            if (!isPairTaken) {
                // Aimantage parfait au centre de la cible
                const coords = getDotCenter(targetEl);
                activeCable.element.setAttribute("x2", coords.x);
                activeCable.element.setAttribute("y2", coords.y);
                activeCable.element.setAttribute("stroke", "#00ff66"); // Vert de connexion validée !
                
                // Enregistrement standardisé : de 'from' (input) à 'to' (output)
                connections.push({
                    from: inputId,
                    to: outputId,
                    element: activeCable.element
                });
                
                activeCable = null;
                checkVictory();
                return;
            }
        }
    }
    
    // Si la cible est invalide, identique au départ, ou déjà occupée : autodestruction
    activeCable.element.remove();
    activeCable = null;
}

// --- ATTACHEMENT DES LISTENERS ---

// Événements sur les inputs (Démarre en tant qu'input)
document.querySelectorAll(".input-dot").forEach(dot => {
    dot.addEventListener("mousedown", (e) => startDrawing(e, dot, "input"));
    dot.addEventListener("touchstart", (e) => startDrawing(e, dot, "input"), { passive: false });
});

// Événements sur les outputs (Nouveau : Démarre en tant qu'output !)
document.querySelectorAll(".output-dot").forEach(dot => {
    dot.addEventListener("mousedown", (e) => {
        const outputId = dot.getAttribute("data-id");
        // S'il y a déjà un câble branché sur cet output, on le supprime au clic
        const hasCable = connections.some(conn => conn.to === outputId);
        if (hasCable) {
            e.preventDefault();
            removeCable(outputId);
        } else {
            // Sinon, on commence à tirer un câble depuis cet output !
            startDrawing(e, dot, "output");
        }
    });
    
    dot.addEventListener("touchstart", (e) => {
        const outputId = dot.getAttribute("data-id");
        const hasCable = connections.some(conn => conn.to === outputId);
        if (hasCable) {
            e.preventDefault();
            removeCable(outputId);
        } else {
            startDrawing(e, dot, "output");
        }
    }, { passive: false });
});

// Événements globaux
window.addEventListener("mousemove", moveDrawing);
window.addEventListener("touchmove", moveDrawing, { passive: false });
window.addEventListener("mouseup", endDrawing);
window.addEventListener("touchend", endDrawing);

function checkVictory() {
    console.log("Câbles actuellement branchés :", connections.map(c => `${c.from} -> ${c.to}`));
}

// --- GESTION DU RESIZE (Redessiner les câbles quand l'écran bouge) ---

window.addEventListener("resize", () => {
    // Si aucun câble n'est branché, on n'a rien à faire
    if (connections.length === 0) return;

    connections.forEach(conn => {
        // 1. On va rechercher les éléments HTML physiques dans le DOM via leur data-id
        const inputDot = document.querySelector(`.input-dot[data-id="${conn.from}"]`);
        const outputDot = document.querySelector(`.output-dot[data-id="${conn.to}"]`);

        if (inputDot && outputDot) {
            // 2. On recalcule leurs nouveaux centres parfaits
            const newInCoords = getDotCenter(inputDot);
            const newOutCoords = getDotCenter(outputDot);

            // 3. On met à jour les coordonnées de la ligne SVG existante
            conn.element.setAttribute("x1", newInCoords.x);
            conn.element.setAttribute("y1", newInCoords.y);
            conn.element.setAttribute("x2", newOutCoords.x);
            conn.element.setAttribute("y2", newOutCoords.y);
        }
    });
});