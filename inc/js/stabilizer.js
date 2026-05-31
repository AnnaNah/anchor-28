function currentGridSize() {
    const totalBtns = document.querySelectorAll('.btn').length;
    return Math.sqrt(totalBtns);
}

function getCoordonatesByIndex(index, gridSize = currentGridSize()) {
    return [
        Math.trunc(index / gridSize),
        index % gridSize
    ];
}

function getIndexByCoordonates(coords = [0, 0], gridSize = currentGridSize()) {
    return (coords[0] * gridSize) + coords[1];
}

function lockBtns(keepCenter = false) {
    const btnContainers = document.querySelectorAll('.btn');
    const size = currentGridSize();

    if (keepCenter) {
        // Coordonnées du centre pour une grille 4x4
        const keepUnlockedAreas = [
            [1, 1],
            [1, 2],
            [2, 1],
            [2, 2],
        ];

        btnContainers.forEach((el, index) => {
            const currentCoords = getCoordonatesByIndex(index, size);
            const currentRow = currentCoords[0];
            const currentCol = currentCoords[1];

            const isCenter = keepUnlockedAreas.some(area => area[0] === currentRow && area[1] === currentCol);

            if (!isCenter) {
                el.classList.toggle('disabled');
            }
        });
    } else {
        btnContainers.forEach(el => {
            el.classList.toggle('disabled');
        });
    }
}

function showTextInHintBox(text = []) {
    const container = document.querySelector('#hint-screen');
    
    // Sécurité : On s'assure que text est bien un tableau et qu'il n'est pas vide
    if (!Array.isArray(text) || text.length === 0) return;

    text.forEach(className => {
        const el = document.createElement('span');
        el.classList.add(className); // CORRECTION : La bonne méthode pour ajouter une classe en Vanilla JS
        el.innerText = className;

        container.append(el);
    });

    // Ajout des espaces
    const elSpace = document.createElement('span');
    elSpace.innerHTML = '    ';
    for (let index = 0; index < 2; index++) {
        // On clone le noeud pour pouvoir l'ajouter plusieurs fois proprement
        container.append(elSpace.cloneNode(true));
    }
}

function blink(success = false, blinkTime = 2) {
    const classOfPrestige = success ? 'success' : 'wrong';
    const container = document.querySelector('.container');
    const ANIMATION_DURATION = 300;

    // CORRECTION : On retire les classes séparément, sans tableau
    if (container.classList.contains('success') || container.classList.contains('wrong')) {
        container.classList.remove('success', 'wrong');
    }

    container.classList.add(classOfPrestige);
    
    if (blinkTime > 0) {
        setTimeout(() => {
            container.classList.remove(classOfPrestige);
        }, (2 * ANIMATION_DURATION) * blinkTime);
    }
}