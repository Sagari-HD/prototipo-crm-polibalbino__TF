<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$conn = new mysqli("localhost", "root", "", "polibalbino_db");

$data = json_decode(file_get_contents("php://input"), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $data['id'];

    // CAPTURA DOS DADOS
    $titulo = $data['titulo'] ?? $data['title'] ?? null;
    $cliente = $data['cliente'] ?? $data['client'] ?? null;
    $status = $data['status'] ?? 'Aberto';

    // 💡 O TRUQUE: Ele tenta pegar 'observacoes', se não achar, tenta 'notes'
    $observacoes = $data['observacoes'] ?? $data['notes'] ?? '';

    if (empty($id)) {
        die(json_encode(["error" => "ID não enviado"]));
    }

    // SQL que foca na "casca" do card e inclui as observações
    $stmt = $conn->prepare("UPDATE orcamentos SET 
        titulo = COALESCE(?, titulo), 
        cliente = COALESCE(?, cliente), 
        status = ?, 
        observacoes = ? 
        WHERE id = ?");

    $stmt->bind_param("ssssi", $titulo, $cliente, $status, $observacoes, $id);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Observações salvas!"]);
    } else {
        echo json_encode(["error" => $stmt->error]);
    }
}
$conn->close();
?>