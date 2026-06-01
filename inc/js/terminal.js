let commandsMemoryStack = {
    currentIndex: -1,
    currentCommand: '',
    stack: []
};

const obj = {
    container: document.querySelector('#container'),
    containerChild: document.querySelector('#container > *'),
    screen: document.querySelector('#screen'),
    form: document.querySelector('#user-form'),
    input: document.querySelector('#user-command'),
    location: document.querySelector('#user-location'),
    credit: document.querySelector('#user-credit'),
};

function sd() {
    // console.log('scrolled');
    obj.container.scrollTop = obj.containerChild.getBoundingClientRect().height;
}

function htmlspecialchars(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, function(tag) {
        const charsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        };
        return charsToReplace[tag] || tag;
    });
}

async function sendCommand(command) {
    try {
        const response = await fetch('/inc/php/terminal.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                command: command,
            })
        });
        
        // C'est toujours une bonne habitude de vérifier si le serveur a répondu OK (200)
        if (!response.ok) {
            throw new Error(`Erreur HTTP ! Statut : ${response.status}`);
        }

        const result = await response.json();
        return result;

    } catch (err) {
        console.error('fetching error: ' + err);
        return null; // On renvoie null pour éviter que la suite du code plante
    }
}

// CORRECTION 1 : Utilisation de document.createElement
function appendMessage(text, containHTML = true, options = {}) {
    const el = document.createElement('p');
    
    if (containHTML) el.innerHTML = text;
    else el.innerText = text;

    if (options.classes) {
        options.classes.forEach(className => {
            el.classList.add(className);
        });
    }
    obj.screen.append(el);
    sd();
}

obj.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (obj.input.value === '') return;
    const command = obj.input.value;

    const response = await sendCommand(command);

    // On affiche la ligne de commande tapée par l'utilisateur
    appendMessage(`<span class="lowlight">${obj.location.innerText + htmlspecialchars(command)}</span>`);

    addCommandToMemoryStack(command);

    obj.input.value = '';
    
    // Si la requête a échoué (réseau, etc.) on s'arrête là
    if (!response) return;

    // CORRECTION 2 : Array.isArray à la place de typeof === 'object'
    if (Array.isArray(response)) {
        response.forEach(line => {
            appendMessage(line, {classes: ['mb-4']});
        });
    } else {
        // CORRECTION 3 : On affiche la variable 'response', pas 'el'
        appendMessage(response, {classes: ['mb-4']});
    }
});

function addCommandToMemoryStack(cmd) {
    commandsMemoryStack.stack.unshift(cmd);
    commandsMemoryStack.currentCommand = '';
    commandsMemoryStack.currentIndex = -1;
}

function loadCommandInMemoryStack(direction) {
    const memoryStackLength = commandsMemoryStack.stack.length;
    
    // S'il n'y a rien dans l'historique, on ne fait rien
    if (memoryStackLength === 0) return;

    // 1. Si on est tout au début (-1) et qu'on veut monter, 
    // on sauvegarde d'abord ce que l'utilisateur était en train d'écrire
    if (commandsMemoryStack.currentIndex === -1) {
        commandsMemoryStack.currentCommand = obj.input.value;
    }

    // 2. On change l'index selon la direction (Haut = +1, Bas = -1)
    let newIndex = commandsMemoryStack.currentIndex + direction;

    // 3. ON BLINDE LES LIMITES
    // Si on essaie de descendre plus bas que le texte en cours
    if (newIndex < -1) {
        newIndex = -1;
    }
    // Si on essaie de monter plus haut que la commande la plus vieille
    if (newIndex >= memoryStackLength) {
        newIndex = memoryStackLength - 1;
    }

    // 4. On applique le nouvel index
    commandsMemoryStack.currentIndex = newIndex;

    // 5. On choisit ce qu'on affiche
    if (newIndex === -1) {
        // On remet ce que l'utilisateur écrivait avant de monter dans l'historique
        obj.input.value = commandsMemoryStack.currentCommand;
    } else {
        // On va chercher la commande dans le tableau
        obj.input.value = commandsMemoryStack.stack[newIndex];
    }
}

window.addEventListener('click', () => {
    obj.input.focus();
});

window.addEventListener('keydown', e => {
    if (e.code === 'ArrowUp') {
        e.preventDefault(); // Empêche le curseur de sauter au début du texte !
        loadCommandInMemoryStack(1); // On monte dans le passé (+1)
    }
    else if (e.code === 'ArrowDown') {
        e.preventDefault(); // Empêche les effets de bord
        loadCommandInMemoryStack(-1); // On redescend vers le présent (-1)
    }
});