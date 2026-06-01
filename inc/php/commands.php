<?php

// ------------------------------//
// ------------ HELP ------------//
// ------------------------------//

function help(string $command = '') {
    $jsonPath = $_SERVER['DOCUMENT_ROOT'] . '/inc/json/commands.json';
    $commands = json_decode(file_get_contents($jsonPath), true);

    if (!$command || $command == '') {
        $respTemplate = [];
        
        foreach ($commands as $key => $value) {
            if (isset($value['help_list']) && $value['help_list']) {
                $isUnlocked = isset($value['unlocked']) ? $value['unlocked'] : true;
                $ligneNom = str_pad(strtoupper($value['name']), 15);
                
                if ($isUnlocked) {
                    $respTemplate[] = $ligneNom . $value['description'];
                } else {
                    // La commande est affichée, mais grisée avec un avertissement
                    $respTemplate[] = '<span class="lowlight">' . $ligneNom . '[ INACTIVE ]</span>';
                }
            }
        }
        return join('<br>', $respTemplate);
    } else {
        $commandTarget = strtolower($command);
        
        if (isset($commands[$commandTarget]) && isset($commands[$commandTarget]['help_list']) && $commands[$commandTarget]['help_list']) {
            $isUnlocked = isset($commands[$commandTarget]['unlocked']) ? $commands[$commandTarget]['unlocked'] : true;
            
            if ($isUnlocked) {
                return '<span class="mb-2">' . $commands[$commandTarget]['description'] . '</span><br>' . $commands[$commandTarget]['specified'];
            } else {
                // Message d'erreur roleplay si le joueur demande l'aide d'une commande bloquée
                return ['<span class="alert">ACCÈS REFUSÉ : La documentation de la commande ' . strtoupper($commandTarget) . ' est actuellement hors ligne.</span>'];
            }
        } else {
            return ['<span class="alert">Aucune aide disponible pour la commande : ' . $command . '</span>'];
        }
    }
}

// -----------------------------//
// --------- SUPERHELP ---------//
// -----------------------------//

function superhelp(string $command = '') {
    $jsonPath = $_SERVER['DOCUMENT_ROOT'] . '/inc/json/commands.json';
    $commands = json_decode(file_get_contents($jsonPath), true);

    if (!$command || $command == '') {
        $respTemplate = [];
        
        foreach ($commands as $key => $value) {
            $isUnlocked = isset($value['unlocked']) ? $value['unlocked'] : true;
            $ligneNom = str_pad(strtoupper($value['name']), 15);
            
            if ($isUnlocked) {
                $respTemplate[] = $ligneNom . $value['description'];
            } else {
                // Même logique pour le superhelp, avec un tag un peu plus sécuritaire
                $respTemplate[] = '<span class="lowlight">' . $ligneNom . $value['description'] . ' [ ACCÈS RESTREINT ]</span>';
            }
        }
        return join('<br>', $respTemplate);
    } else {
        $commandTarget = strtolower($command);
        
        if (isset($commands[$commandTarget])) {
            $isUnlocked = isset($commands[$commandTarget]['unlocked']) ? $commands[$commandTarget]['unlocked'] : true;
            
            if ($isUnlocked) {
                return '<span class="mb-2">' . $commands[$commandTarget]['description'] . '</span><br>' . $commands[$commandTarget]['specified'];
            } else {
                // Message d'erreur roleplay pour superhelp
                return ['<span class="alert">ACCÈS RESTREINT : La commande ' . strtoupper($commandTarget) . ' nécessite une élévation des privilèges.</span>'];
            }
        } else {
            return ['<span class="alert">Aucune aide disponible pour la commande : ' . $command . '</span>'];
        }
    }
}

// -----------------------------//
// ---------- LOGBOOK ----------//
// -----------------------------//

function logbook(string $command = '') {
    $jsonPath = $_SERVER['DOCUMENT_ROOT'] . '/inc/json/commands.json';
    $commands = json_decode(file_get_contents($jsonPath), true);

    function displayList(array $list) {
        $respTemplate = [];
        foreach ($list['logbook']['logs'] as $key => $value) {
            if ($key !== 'unlocked') { // On évite d'afficher la clé "unlocked" comme un log
                $ligne = strtoupper($key);
                $respTemplate[] = $ligne;
            }
        }
        return join('<br>', $respTemplate);
    }

    if (!$command || $command == '') {
        return displayList($commands);
    } else {
        $commandTarget = strtr(strtolower($command), ' ', '-');
        if (isset($commands['logbook']['logs'][$commandTarget])) {
            return '<span class="highlight">' . strtoupper($commandTarget) . ':</span><br>' . $commands['logbook']['logs'][$commandTarget];
        } else {
            return ['<span class="alert">Aucune entrée n\'a été trouvée pour "' . strtoupper($commandTarget) . '".</span><br><span class="lowlight">Essayez:<br>' . displayList($commands) . '</span>'];
        }
    }
}

// ------------------------------//
// ---------- CHECKMOD ----------//
// ------------------------------//

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
                    $output[] = '    ' . '[' . $subel['shortcode'] . ']' . str_pad($subel['name'], $PAD_LENGTH - 4, " ") . '  |  ' . $subel['status'];
                }
            } else {
                $output[] = str_pad('[' . $el['shortcode'] . ']' . $el['name'], $PAD_LENGTH + 6, " ") . '  |  ' . $el['status'];
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
            return [str_pad('[' . $el['shortcode'] . ']' . $el['name'], $PAD_LENGTH, " ") . '  |  ' . $el['status']];
        }

        if (isset($el['has_hierarchy']) && $el['has_hierarchy'] == true && isset($el['content'])) {
            foreach ($el['content'] as $subel) {
                if (strtolower($subel['name']) === $target) {
                    return [str_pad('[' . $el['shortcode'] . ']' . $subel['name'], $PAD_LENGTH, " ") . '  |  ' . $subel['status']];
                }
            }
        }
    }
    return ["Module '" . $command . "' introuvable dans le registre de l'Ancre."];
}

// ------------------------------//
// ----------- MANUAL -----------//
// ------------------------------//

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

// -----------------------------//
// ---------- ROOTMOD ----------//
// -----------------------------//

function rootmod(string $command = '') {
    if (!$command || $command === '') {
        return '<span class="alert">ERREUR : Clé d\'authentification manquante.<br>Syntaxe : ROOTMOD [cle_authentification]</span>';
    }

    $keyToTest = strtoupper(trim($command));
    $statusPath = $_SERVER['DOCUMENT_ROOT'] . '/inc/json/status.json';
    
    if (!file_exists($statusPath)) {
        return '<span class="alert">ERREUR CRITIQUE : Registre des statuts introuvable.</span>';
    }

    $statusData = json_decode(file_get_contents($statusPath), true);
    $statusData = is_array($statusData) ? $statusData : [];

    foreach ($statusData as $moduleKey => $moduleInfo) {
        if (isset($moduleInfo['code']) && is_array($moduleInfo['code']) && isset($moduleInfo['shortcode'])) {
            $shortcode = strtoupper($moduleInfo['shortcode']);
            
            foreach ($moduleInfo['code'] as $upgradeLevel => $codeValue) {
                $expectedKey = $shortcode . '-' . strtoupper($codeValue);
                
                if ($keyToTest === $expectedKey) {
                    $moduleName = strtoupper($moduleInfo['name']);
                    $response = [];
                    $response[] = '<span class="highlight">[ ACCÈS AUTORISÉ ]</span>';
                    $response[] = 'Clé valide reconnue pour le module: [' . $shortcode . '] ' . $moduleName;
                    
                    $newState = null; 
                    
                    if ($upgradeLevel === 'upgrade_1' && $moduleInfo['status'] === 'safe_mode') {
                        $response[] = '-> Changement d\'état: <span class="highlight">REBOOTING</span> (Accès partiellement restauré)';
                        $newState = 'rebooting';
                    }
                    elseif ($upgradeLevel === 'upgrade_1' && $moduleInfo['status'] === 'rebooting') {
                        $response[] = '<span class="alert">-> Changement d\'état annulé: <span class="highlight">REBOOTING</span> déjà activé.</span>';
                    }
                    elseif ($upgradeLevel === 'upgrade_2' && $moduleInfo['status'] === 'rebooting') {
                        $response[] = '-> Changement d\'état: <span class="highlight">ONLINE</span> (Accès total)';
                        $newState = 'online';
                    }
                    elseif ($upgradeLevel === 'upgrade_2' && $moduleInfo['status'] === 'online') {
                        $response[] = '<span class="alert">-> Changement d\'état annulé: <span class="highlight">ONLINE</span> déjà activé.</span><br>Ce module d\'urgence est opérationnel.';
                    }
                    elseif ($upgradeLevel === 'upgrade_2' && $moduleInfo['status'] === 'safe_mode') {
                        $response[] = '<span class="alert">-> Changement d\'état annulé: Le module doit d\'abord passé en <span class="highlight">REBOOTING</span></span>';
                    }
                    else {
                        $response[] = '<span class="alert">-> Changement d\'état annulé: Le système a rencontré une erreur inattendue</span>';
                    }
                    
                    $response[] = '<span class="lowlight">Synchronisation du sous-système en cours...</span>';

                    if ($newState !== null) {
                        $statusData[$moduleKey]['status'] = $newState;
                        file_put_contents($statusPath, json_encode($statusData, JSON_PRETTY_PRINT));
                    }

                    return join('<br>', $response);
                }
            }
        }
    }
    return '<span class="alert">[ ACCÈS REFUSÉ ] Clé d\'authentification "' . $keyToTest . '" non reconnue par le système.<br>Vérifiez la clé d\'authentification et/ou le préfixe du module.</span>';
}

// -----------------------------//
// ------------ TXT ------------//
// -----------------------------//

function txt(string $command = '') {
    $baseDir = $_SERVER['DOCUMENT_ROOT'] . '/src/texts/';
    if (!is_dir($baseDir)) {
        mkdir($baseDir, 0777, true);
    }

    $args = preg_split('/\s+/', trim($command), 2);
    $action = strtolower($args[0]);
    $rest = isset($args[1]) ? $args[1] : '';

    // Action LIST
    if ($action === 'list') {
        $files = array_diff(scandir($baseDir), array('..', '.'));
        
        if (empty($files)) {
            return '<span class="lowlight">Aucun fichier texte trouvé dans la base de données locale.</span>';
        }

        // On nettoie l'affichage en retirant l'extension .txt de chaque fichier
        $cleanFiles = array_map(function($file) {
            return pathinfo($file, PATHINFO_FILENAME);
        }, $files);

        return '<span class="highlight">Index des fichiers locaux :</span><br> - ' . implode('<br> - ', $cleanFiles);
    }

    $fileArgs = preg_split('/\s+/', trim($rest), 2);
    $rawFilename = $fileArgs[0];
    $contentToAdd = isset($fileArgs[1]) ? $fileArgs[1] : '';

    if (empty($rawFilename)) {
        return '<span class="alert">Erreur de syntaxe. Nom de fichier manquant.</span>';
    }

    $safeFilename = preg_replace('/[^a-zA-Z0-9_-]/', '', $rawFilename);
    if (empty($safeFilename)) {
        return '<span class="alert">Erreur : Nom de fichier invalide.</span>';
    }
    $filename = $safeFilename . '.txt';
    $filepath = $baseDir . $filename;

    switch ($action) {
        case 'create':
            if (file_exists($filepath)) {
                return '<span class="alert">Erreur : Le fichier ' . $safeFilename . ' existe déjà.</span>';
            }
            file_put_contents($filepath, "");
            return 'Secteur alloué. Fichier <span class="highlight">' . $safeFilename . '</span> créé.';

        case 'look':
            if (!file_exists($filepath)) {
                return '<span class="alert">Erreur 404 : Fichier ' . $safeFilename . ' introuvable.</span>';
            }
            $fileContent = file_get_contents($filepath);
            // 1. htmlspecialchars sécurise le texte brut
            // 2. nl2br convertit les vrais sauts de ligne du fichier en balises <br>
            return '<span class="highlight">--- ' . $safeFilename . ' ---</span><br>' . ($fileContent ? nl2br(htmlspecialchars($fileContent)) : '<span class="lowlight">[ Fichier vide ]</span>');

        case 'addto':
            if (!file_exists($filepath)) {
                return '<span class="alert">Erreur : Fichier ' . $safeFilename . ' introuvable.</span>';
            }
            if (empty($contentToAdd)) {
                return '<span class="alert">Erreur : Aucun contenu spécifié.</span>';
            }
            // On ajoute le texte brut suivi d'un vrai saut de ligne (PHP_EOL)
            file_put_contents($filepath, $contentToAdd . PHP_EOL, FILE_APPEND);
            return 'Données annexées avec succès au registre <span class="highlight">' . $safeFilename . '</span>.';

        case 'clear':
            if (!file_exists($filepath)) {
                return '<span class="alert">Erreur : Fichier ' . $safeFilename . ' introuvable.</span>';
            }
            file_put_contents($filepath, "");
            return 'Contenu du fichier <span class="highlight">' . $safeFilename . '</span> purgé.';

        case 'remove':
            if (!file_exists($filepath)) {
                return '<span class="alert">Erreur : Fichier ' . $safeFilename . ' introuvable.</span>';
            }
            unlink($filepath);
            return 'Fichier <span class="highlight">' . $safeFilename . '</span> désintégré.';

        default:
            return '<span class="alert">Paramètre inconnu. Syntaxe : TXT create|list|look|addto|clear|remove [fichier]</span>';
    }
}