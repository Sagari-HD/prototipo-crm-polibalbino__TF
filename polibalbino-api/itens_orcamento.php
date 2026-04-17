<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$conn = new mysqli("localhost", "root", "", "polibalbino_db");

if ($conn->connect_error) {
    die(json_encode(["error" => "Falha na conexão"]));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $orcamento_id = $data['orcamento_id'];
    $items = $data['items']; // Esperamos um array de itens

    if (empty($orcamento_id) || empty($items)) {
        die(json_encode(["error" => "Dados incompletos"]));
    }

    $successCount = 0;

    foreach ($items as $item) {
        $codigo = $item['productCode'];
        $quantidade = $item['quantity'];
        $preco = $item['price'];

        // 1. Inserir o item na tabela de ligação
        $stmt = $conn->prepare("INSERT INTO itens_orcamento (orcamento_id, produto_codigo, quantidade, preco_unitario) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("isid", $orcamento_id, $codigo, $quantidade, $preco);
        
        if ($stmt->execute()) {
            // 2. ATUALIZAR O RESERVADO NO STOCK (A lógica que faltava!)
            // Somamos a quantidade deste item ao que já estava reservado no produto
            $updateStmt = $conn->prepare("UPDATE produtos SET quantidade_reservada = quantidade_reservada + ? WHERE codigo = ?");
            $updateStmt->bind_param("is", $quantidade, $codigo);
            $updateStmt->execute();
            
            $successCount++;
        }
    }

    echo json_encode([
        "message" => "Itens vinculados com sucesso!",
        "itens_salvos" => $successCount,
        "orcamento_id" => $orcamento_id
    ]);
}

$conn->close();
?>
