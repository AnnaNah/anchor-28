<?php

function help(string $command = '') {
    $jsonPath = $_SERVER['DOCUMENT_ROOT'] . '/inc/json/commands.json';
    $commands = json_decode(file_get_contents($jsonPath), true);

    // Si l'utilisateur a juste tapé "help" sans argument
    if (!$command || $command == '') {
        
        $respTemplate = []; // On va carrément créer un tableau de lignes, ce sera plus simple pour ton JS !
        
        foreach ($commands as $key => $value) {
            // Si la commande doit être affichée dans la liste d'aide
            if ($value['help_list']) {
                // On utilise le point (.) pour concaténer, et on corrige l'orthographe de "description"
                $ligne = str_pad(strtoupper($value['name']), 15) . $value['description'];
                $respTemplate[] = $ligne;
            }
        }
        
        return join('<br>', $respTemplate); // On renvoie le tableau de lignes
    } 
    
    // Si l'utilisateur a tapé "help open" par exemple
    else {
        $commandTarget = strtolower($command);
        
        if (isset($commands[$commandTarget]) && $commands[$commandTarget]['help_list']) {
            // On renvoie la description détaillée (le champ specified du JSON)
            // On utilise explode pour séparer les retours à la ligne du JSON en lignes de tableau
            // return explode("\n", $commands[$commandTarget]['specified']);
            return '<span class="mb-2">' . $commands[$commandTarget]['description'] . '</span><br>' . $commands[$commandTarget]['specified'];
        } else {
            return ['<span class="alert">Aucune aide disponible pour la commande : ' . $command . '</span>'];
        }
    }
}

function superhelp(string $command = '') {
    $jsonPath = $_SERVER['DOCUMENT_ROOT'] . '/inc/json/commands.json';
    $commands = json_decode(file_get_contents($jsonPath), true);

    // Si l'utilisateur a juste tapé "help" sans argument
    if (!$command || $command == '') {
        
        $respTemplate = []; // On va carrément créer un tableau de lignes, ce sera plus simple pour ton JS !
        
        foreach ($commands as $key => $value) {
            // On utilise le point (.) pour concaténer, et on corrige l'orthographe de "description"
            $ligne = str_pad(strtoupper($value['name']), 15) . $value['description'];
            $respTemplate[] = $ligne;
        }
        
        return join('<br>', $respTemplate); // On renvoie le tableau de lignes
    } 
    
    // Si l'utilisateur a tapé "help open" par exemple
    else {
        $commandTarget = strtolower($command);
        
        if (isset($commands[$commandTarget])) {
            // On renvoie la description détaillée (le champ specified du JSON)
            // On utilise explode pour séparer les retours à la ligne du JSON en lignes de tableau
            // return explode("\n", $commands[$commandTarget]['specified']);
            return '<span class="mb-2">' . $commands[$commandTarget]['description'] . '</span><br>' . $commands[$commandTarget]['specified'];
        } else {
            return ['<span class="alert">Aucune aide disponible pour la commande : ' . $command . '</span>'];
        }
    }
}

function logbook(string $command = '') {
    $jsonPath = $_SERVER['DOCUMENT_ROOT'] . '/inc/json/commands.json';
    $commands = json_decode(file_get_contents($jsonPath), true);

    function displayList(array $list) {
        $respTemplate = []; // On va carrément créer un tableau de lignes, ce sera plus simple pour ton JS !
        foreach ($list['logbook']['logs'] as $key => $value) {
            // On utilise le point (.) pour concaténer, et on corrige l'orthographe de "description"
            $ligne = strtoupper($key);
            $respTemplate[] = $ligne;
        }
        return join('<br>', $respTemplate); // On renvoie le tableau de lignes
    }

    // Si l'utilisateur a juste tapé "help" sans argument
    if (!$command || $command == '') {
        
        return displayList($commands);
    } 
    
    // Si l'utilisateur a tapé "help open" par exemple
    else {
        $commandTarget = strtr(strtolower($command), ' ', '-');
        
        if (isset($commands['logbook']['logs'][$commandTarget])) {
            // On renvoie la description détaillée (le champ specified du JSON)
            // On utilise explode pour séparer les retours à la ligne du JSON en lignes de tableau
            // return explode("\n", $commands[$commandTarget]['specified']);
            return strtoupper($commandTarget) . ':<br>' . $commands['logbook']['logs'][$commandTarget];
        } else {
            return ['<span class="alert">Aucune entrée n\'a été trouvée pour "' . strtoupper($commandTarget) . '".</span><br><span class="lowlight">Essayez:<br>' . displayList($commands) . '</span>'];
        }
    }
}

function checkmod(string $command = '') {
    $PAD_LENGTH = 30;
    
    $links = [
        'real' => $_SERVER['DOCUMENT_ROOT'] . '/inc/json/status.json',
        'fake' => $_SERVER['DOCUMENT_ROOT'] . '/inc/json/fake_status.json',
    ];

    $formatOutput = function(array $list, int $PAD_LENGTH) {
        $output = [];

        foreach ($list as $el) {
            if (isset($el['has_hierarchy']) && $el['has_hierarchy'] == true) {
                $output[] = '<span class="highlight">[ ' . strtoupper($el['name']) . ' ]</span>';

                foreach ($el['content'] as $subel) {
                    $output[] = '    ' . str_pad($subel['name'], $PAD_LENGTH - 4, " ") . '|  ' . $subel['status'];
                }
            } else {
                $output[] = str_pad($el['name'], $PAD_LENGTH, " ") . '|  ' . $el['status'];
            }
        }

        return $output;
    };

    $realData = json_decode(file_get_contents($links['real']), true);
    $fakeData = json_decode(file_get_contents($links['fake']), true);
    
    $realData = is_array($realData) ? $realData : [];
    $fakeData = is_array($fakeData) ? $fakeData : [];

    $status = array_merge($realData, $fakeData);

    if (!$command || $command == '') {
        return join('<br>', $formatOutput($status, $PAD_LENGTH));
    }

    $target = strtolower(trim($command));
    
    foreach ($status as $el) {
        
        if (strtolower($el['name']) === $target) {
            if (isset($el['has_hierarchy']) && $el['has_hierarchy'] == true) {
                return join('<br>', $formatOutput([$el], $PAD_LENGTH));
            }
            return [str_pad($el['name'], $PAD_LENGTH, " ") . '|  ' . $el['status']];
        }

        if (isset($el['has_hierarchy']) && $el['has_hierarchy'] == true && isset($el['content'])) {
            foreach ($el['content'] as $subel) {
                if (strtolower($subel['name']) === $target) {
                    return [str_pad($subel['name'], $PAD_LENGTH, " ") . '|  ' . $subel['status']];
                }
            }
        }
    }

    return ["Module '" . $command . "' introuvable dans le registre de l'Ancre."];
}

function manual(string $command = '') {
    $jsonPath = $_SERVER['DOCUMENT_ROOT'] . '/inc/json/manual.json';
    $statusPath = $_SERVER['DOCUMENT_ROOT'] . '/inc/json/status.json';
    
    if (!file_exists($jsonPath)) {
        return ["ERROR: Les banques de données du manuel d'urgence sont introuvables."];
    }
    
    $manualData = json_decode(file_get_contents($jsonPath), true);
    $manualData = is_array($manualData) ? $manualData : [];

    if (!$command || $command == '') {
        $lines = [
            '<span class="highlight">--- DIRECTIVES DE CRISES ET PROTOCOLES DE MAINTENANCE ---</span>',
            "Spécifiez un module valide pour extraire sa procédure de dépannage d'urgence.",
            "Syntaxe : MANUAL [nom_module]",
            "<br>Index des sous-systèmes fonctionnels répertoriés :"
        ];
        
        foreach (array_keys($manualData) as $moduleName) {
            $lines[] = " - " . strtolower($moduleName);
        }
        
        return [join('<br>', $lines)];
    }

    $target = strtolower(trim($command));

    if (isset($manualData[$target])) {
        
        $currentStatus = 'safe_mode';
        
        if (file_exists($statusPath)) {
            $statusData = json_decode(file_get_contents($statusPath), true);
            if (isset($statusData[$target]['status'])) {
                $currentStatus = $statusData[$target]['status'];
            }
        }

        if (isset($manualData[$target][$currentStatus])) {
            $textBlock = $manualData[$target][$currentStatus];
            
            if (is_array($textBlock)) {
                return [join('<br>', $textBlock)];
            } else {
                return [$textBlock];
            }
        } else {
            return ["ERROR: Aucune directive de maintenance répertoriée pour le statut '" . strtoupper($currentStatus) . "'."];
        }
    }

    $errorLines = [
        "CRITICAL ERROR: INDEX INTROUVABLE",
        "Le sous-système '" . $command . "' n'est pas répertorié dans les schémas d'urgence.",
        "Vérifier les modules d'urgences avec MANUAL ou consultez la liste de tous les modules avec CHECKMOD."
    ];
    
    return [join('<br>', $errorLines)];
}