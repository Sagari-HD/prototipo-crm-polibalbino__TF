<?php
// polibalbino-api/logout.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require_once 'auth.php'; // valida o token e popula $usuarioAutenticado

$conn = new mysqli("localhost", "root", "", "polibalbino_db");
$conn->set_charset("utf8mb4");

$stmt = $conn->prepare("UPDATE usuarios SET token = NULL WHERE id = ?");
$stmt->bind_param("i", $usuarioAutenticado['id']);
$stmt->execute();

echo json_encode(["success" => true]);
$conn->close();
?>