<?php
// ==========================================
// SCRIPT DE RÉINITIALISATION DE L'ARCHE
// ==========================================

$statusPath = $_SERVER['DOCUMENT_ROOT'] . '/inc/json/status.json';

// --- 1. GESTION DU POST (Le joueur a cliqué sur un bouton) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['sure'])) {
    
    if ($_POST['sure'] === 'yes') {
        if (!file_exists($statusPath)) {
            die('<h2 style="color: red; font-family: monospace;">[ ERREUR CRITIQUE ] Fichier status.json introuvable.</h2>');
        }

        $statusData = json_decode(file_get_contents($statusPath), true);

        if (is_array($statusData)) {
            foreach ($statusData as $moduleKey => $moduleInfo) {
                $statusData[$moduleKey]['status'] = 'safe_mode';
            }
            file_put_contents($statusPath, json_encode($statusData, JSON_PRETTY_PRINT));
            
            // --- PURGE DU DOSSIER TEXTS ---
            $textsDir = $_SERVER['DOCUMENT_ROOT'] . '/src/texts/';
            if (is_dir($textsDir)) {
                $files = glob($textsDir . '*'); 
                foreach ($files as $file) {
                    if (is_file($file)) {
                        unlink($file); // Suppression du fichier
                    }
                }
            }
            // ------------------------------
            
            echo '<div style="background-color: #111; color: #39ff14; padding: 2rem; font-family: monospace; border: 2px solid #39ff14; border-radius: 8px; max-width: 600px; margin: 2rem auto; text-align: center;">';
            echo '<h3>[ SYSTÈME RÉINITIALISÉ ]</h3>';
            echo '<p>Tous les modules de l\'Ancre ont été purgés et replacés en <strong>SAFE_MODE</strong>.</p>';
            echo '<p>Les fichiers textes temporaires ont été <strong>EFFACÉS</strong>.</p>';
            echo '<br><a href="?" style="color: #39ff14; text-decoration: none; border: 1px solid #39ff14; padding: 0.5rem 1rem;">RETOUR</a>';
            echo '</div>';
        } else {
            echo '<h2 style="color: red; font-family: monospace;">[ ERREUR ] Corruption du fichier JSON. Reset impossible.</h2>';
        }
        exit;
    }
}

// --- 2. AFFICHAGE PAR DÉFAUT (L'interface d'alerte) ---
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>OVERRIDE SYSTEM</title>
    <style>
        body {
            background-color: #050505;
            color: #fff;
            font-family: "Courier New", Courier, monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .modal {
            background-color: #1a0505;
            border: 2px solid #ff002b;
            padding: 3rem;
            border-radius: 6px;
            text-align: center;
            box-shadow: 0 0 30px rgba(255, 0, 43, 0.4);
        }
        .title {
            color: #ff002b;
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
            text-shadow: 0 0 10px rgba(255, 0, 43, 0.5);
        }
        .btn-group {
            margin-top: 2rem;
            display: flex;
            gap: 2rem;
            justify-content: center;
        }
        button {
            padding: 0.8rem 2rem;
            font-family: inherit;
            font-size: 1.2rem;
            font-weight: bold;
            cursor: pointer;
            border: none;
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        .btn-yes { 
            background-color: #ff002b; 
            color: white; 
            box-shadow: 0 0 15px rgba(255,0,43,0.5);
        }
        .btn-yes:hover { 
            background-color: #fff; 
            color: #ff002b; 
            transform: scale(1.05);
        }
        .btn-no { 
            background-color: #333; 
            color: white; 
            border: 1px solid #666;
        }
        .btn-no:hover { 
            background-color: #555; 
        }
        .cancel-msg {
            color: #39ff14;
            margin-top: 1.5rem;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="modal">
        <div class="title">[ CRITICAL OVERRIDE ]</div>
        <p>RESET: YA SURE?</p>
        
        <form method="POST" class="btn-group">
            <button type="submit" name="sure" value="yes" class="btn-yes">YES</button>
            <button type="submit" name="sure" value="no" class="btn-no">NO</button>
        </form>

        <?php 
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['sure']) && $_POST['sure'] === 'no') {
            echo '<div class="cancel-msg">Procédure annulée. Retour à la normale.</div>';
        }
        ?>
    </div>
</body>
</html>