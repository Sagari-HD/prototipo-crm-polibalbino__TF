<?php
// auth.php — Validador de token central. Inclua no topo de cada endpoint protegido.

session_start();

// Pega o token do cabeçalho Authorization: Bearer <token>
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

// Valida se o token existe e corresponde à sessão ativa
if (empty($token) || !isset($_SESSION['token']) || $_SESSION['token'] !== $token) {
    http_response_code(401);
    echo json_encode(["error" => "Não autorizado. Faça login novamente."]);
    exit;
}
// Se chegar aqui, a requisição está autenticada.
?>