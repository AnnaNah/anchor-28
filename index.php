<?php

$template = '';

function gotoError() { header('Location: /?module=404'); exit(); }

if (!isset($_GET['module'])) gotoError();

$links = [
    'head' => '/inc/html/head.html',
    'foot' => '/inc/html/foot.html',
    'html' => '/inc/html/' . htmlspecialchars($_GET['module']) . '.html',
    'css' => '/inc/css/' . htmlspecialchars($_GET['module']) . '.css',
    'js' => '/inc/js/' . htmlspecialchars($_GET['module']) . '.js',
];

foreach ($links as $link) {
    if (!file_exists($_SERVER['DOCUMENT_ROOT'] . $link)) gotoError();
}

$template .= strtr(file_get_contents($_SERVER['DOCUMENT_ROOT'] . $links['head']),
[
    '__module_name__' => strtoupper(htmlspecialchars($_GET['module'])),
    '__css_link__' => $links['css'],
]);

$template .= file_get_contents($_SERVER['DOCUMENT_ROOT'] . $links['html']);

$template .= strtr(file_get_contents($_SERVER['DOCUMENT_ROOT'] . $links['foot']),
[
    '__js_link__' => $links['js'],
]);

echo $template;