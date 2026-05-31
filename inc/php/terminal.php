<?php

$jsonBrut = file_get_contents('php://input');
$donnees = json_decode($jsonBrut, true);

header('Content-Type: application/json; charset=utf-8');

if (!isset($donnees['command']) || empty(trim($donnees['command']))) {
    echo json_encode(['err' => 'post error: command has not been transmitted to server.']);
    exit;
}

// On charge le fichier de fonctions
require $_SERVER['DOCUMENT_ROOT'] . '/inc/php/commands.php';

$instructionsRecue = $donnees['command'];

$decomposed = preg_split('/\s+/', trim($instructionsRecue), 2);
$commande = strtolower($decomposed[0]); // On passe en minuscule pour être tranquille
$arguments = isset($decomposed[1]) ? $decomposed[1] : ''; // Sécurisé si pas d'argument

$messageErreur = '<span class="alert">"' . $commande . '" n\'est pas reconnu en tant que commande interne ou externe, un programme exécutable ou un fichier de commandes.</span>';
$returnMessage = null;

// CORRECTION ICI : Le "true" est à la fin du json_decode !
$commandsList = json_decode(file_get_contents($_SERVER['DOCUMENT_ROOT'] . '/inc/json/commands.json'), true);

// On vérifie si la commande existe dans le JSON
if (isset($commandsList[$commande])) {
    $nomFonction = $commandsList[$commande]['commandName'];
    
    // On vérifie que la fonction existe bien dans commands.php
    if (function_exists($nomFonction)) {
        $returnMessage = $nomFonction($arguments);
    } else {
        $returnMessage = "Erreur interne : La fonction pour '" . $commande . "' n'est pas encore codée côté serveur.";
    }
} else {
    $returnMessage = $messageErreur;
}

// Si la fonction nous a renvoyé un tableau (comme pour le help), on le transmet directement
// Sinon, on l'enveloppe dans un tableau pour ton JS
if (is_array($returnMessage)) {
    echo json_encode($returnMessage);
} else {
    echo json_encode([$returnMessage]);
}
exit;