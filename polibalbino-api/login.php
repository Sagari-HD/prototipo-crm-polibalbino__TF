<?php
session_start(); // 🔐 Inicia a sessão no topo do arquivo

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$conn = new mysqli("localhost", "root", "", "polibalbino_db");

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

$stmt = $conn->prepare("SELECT id, nome as name, cargo as role, email, senha FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['senha'])) {
        unset($user['senha']); // Nunca devolva o hash para o frontend

        // Gera um token único para esta sessão
        $token = bin2hex(random_bytes(32));
        $_SESSION['token'] = $token;

        // Devolve o token junto com os dados do usuário
        $user['token'] = $token;
        echo json_encode($user);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "E-mail ou senha incorretos."]);
    }
} else {
    http_response_code(401);
    echo json_encode(["error" => "E-mail ou senha incorretos."]);
}

$conn->close();
?>