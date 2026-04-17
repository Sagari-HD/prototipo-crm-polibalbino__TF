<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $conn = new mysqli("localhost", "root", "", "polibalbino_db");
    $conn->set_charset("utf8mb4");

    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if (!$data) {
        throw new Exception("Dados não recebidos ou JSON inválido.");
    }

    $conn->begin_transaction();

    $id = $data['id'] ?? null;
    $cnpj = $data['cnpj'] ?? '';
    $contato = $data['contato'] ?? '';
    $transp = $data['transportadora'] ?? '';
    $frete = $data['tipo_frete'] ?? '';
    $retirada = $data['local_retirada'] ?? '';
    $vencimento = !empty($data['data_vencimento']) ? $data['data_vencimento'] : null;
    $pagamento = $data['forma_pagamento'] ?? '';
    $parcelamento = $data['parcelamento'] ?? '';
    $total = (float) ($data['valor_total'] ?? 0);

    if ($id) {
        // --- 🟢 MODO ATUALIZAR ---
        $sqlOrc = "UPDATE orcamentos SET 
                    cnpj = ?, contato = ?, transportadora = ?, tipo_frete = ?, 
                    local_retirada = ?, data_vencimento = ?, forma_pagamento = ?, 
                    parcelamento = ?, valor_total = ?, status = 'Aberto' 
                   WHERE id = ?";

        $stmt = $conn->prepare($sqlOrc);
        $stmt->bind_param("ssssssssdi", $cnpj, $contato, $transp, $frete, $retirada, $vencimento, $pagamento, $parcelamento, $total, $id);
        $stmt->execute();
        $orcamento_id = $id;
    } else {
        // --- 🔵 MODO CRIAR ---
        $sqlOrc = "INSERT INTO orcamentos (cnpj, contato, transportadora, tipo_frete, local_retirada, data_vencimento, forma_pagamento, parcelamento, valor_total, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Aberto')";
        $stmt = $conn->prepare($sqlOrc);
        $stmt->bind_param("ssssssssd", $cnpj, $contato, $transp, $frete, $retirada, $vencimento, $pagamento, $parcelamento, $total);
        $stmt->execute();
        $orcamento_id = $conn->insert_id;
    }

    // --- 📦 INSERIR ITENS (SEM RESERVAR ESTOQUE) ---
    if (!empty($data['itens']) && is_array($data['itens'])) {
        if ($id) {
            $conn->query("DELETE FROM itens_orcamento WHERE orcamento_id = $id");
        }

        foreach ($data['itens'] as $item) {
            $codigo = $item['codigo'];
            $qtd = (double) $item['quantidade'];
            $preco = (double) $item['preco_vendido'];

            $sqlItem = "INSERT INTO itens_orcamento (orcamento_id, produto_codigo, quantidade, preco_unitario) VALUES (?, ?, ?, ?)";
            $stmtItem = $conn->prepare($sqlItem);
            $stmtItem->bind_param("isdd", $orcamento_id, $codigo, $qtd, $preco);
            $stmtItem->execute();

            // 🚩 AS LINHAS DO UPDATE ESTOQUE FORAM REMOVIDAS DAQUI!
        }
    }

    $conn->commit();
    echo json_encode(["success" => true, "message" => "Orçamento atualizado com sucesso!", "id" => $orcamento_id]);

} catch (Exception $e) {
    if (isset($conn))
        $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
} finally {
    if (isset($conn))
        $conn->close();
}
?>