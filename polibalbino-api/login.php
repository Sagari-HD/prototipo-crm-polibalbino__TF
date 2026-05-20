<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$conn = new mysqli("localhost", "root", "", "polibalbino_db");
$conn->set_charset("utf8mb4");

$data = json_decode(file_get_contents("php://input"), true);
$email    = $data['email']    ?? '';
$password = $data['password'] ?? '';

$stmt = $conn->prepare(
    "SELECT id, nome AS name, cargo AS role, email, senha FROM usuarios WHERE email = ?"
);
$stmt->bind_param("s", $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

if ($user && password_verify($password, $user['senha'])) {
    // Gera token e persiste no banco
    $token = bin2hex(random_bytes(32));
    $upd   = $conn->prepare("UPDATE usuarios SET token = ? WHERE id = ?");
    $upd->bind_param("si", $token, $user['id']);
    $upd->execute();

    unset($user['senha']);
    $user['token'] = $token;
    echo json_encode($user);
} else {
    http_response_code(401);
    echo json_encode(["error" => "E-mail ou senha incorretos."]);
}
$conn->close();