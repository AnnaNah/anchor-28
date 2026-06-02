<?php
header('Content-Type: application/json; charset=utf-8');

// On récupère les données envoyées en POST (format JSON)
$jsonBrut = file_get_contents('php://input');
$donnees = json_decode($jsonBrut, true);

// On vérifie que le paramètre module a bien été envoyé
if (!isset($donnees['module']) || empty(trim($donnees['module']))) {
    echo json_encode(['error' => 'Paramètre module manquant.']);
    exit;
}

$moduleName = strtolower(trim($donnees['module']));
$statusPath = $_SERVER['DOCUMENT_ROOT'] . '/inc/json/status.json';

if (!file_exists($statusPath)) {
    echo json_encode(['error' => 'status.json introuvable']);
    exit;
}

$statusData = json_decode(file_get_contents($statusPath), true);

// On renvoie le statut
if (isset($statusData[$moduleName]['status'])) {
    echo json_encode(['status' => $statusData[$moduleName]['status']]);
} else {
    echo json_encode(['error' => 'Module "' . $moduleName . '" introuvable dans le registre.']);
}
exit;