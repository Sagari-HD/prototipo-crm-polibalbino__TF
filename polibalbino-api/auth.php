<?php
// auth.php — valida o token consultando o banco. 

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$headers     = getallheaders();
$authHeader  = $headers['Authorization'] ?? '';
$token       = str_replace('Bearer ', '', $authHeader);

if (empty($token)) {
    http_response_code(401);
    echo json_encode(["error" => "Token ausente. Faça login novamente."]);
    exit;
}

$conn = new mysqli("localhost", "root", "", "polibalbino_db");
$conn->set_charset("utf8mb4");

$stmt = $conn->prepare("SELECT id, cargo FROM usuarios WHERE token = ?");
$stmt->bind_param("s", $token);
$stmt->execute();
$usuario = $stmt->get_result()->fetch_assoc();

if (!$usuario) {
    http_response_code(401);
    echo json_encode(["error" => "Sessão inválida. Faça login novamente."]);
    exit;
}

// Disponibiliza o usuário autenticado para os endpoints que precisarem
$usuarioAutenticado = $usuario;
// Se a conexão foi aberta aqui, os outros arquivos reabrem a própria.
?>