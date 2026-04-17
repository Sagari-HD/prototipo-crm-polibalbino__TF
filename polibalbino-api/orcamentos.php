<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$conn = new mysqli("localhost", "root", "", "polibalbino_db");

if ($conn->connect_error) {
    die(json_encode(["error" => "Conexão falhou: " . $conn->connect_error]));
}

$method = $_SERVER['REQUEST_METHOD'];

// --- 1. BUSCAR ORÇAMENTOS (GET) ---
if ($method === 'GET') {
    $sql = "SELECT *, usuario_id AS createdBy FROM orcamentos ORDER BY criado_em DESC";
    $result = $conn->query($sql);
    $orcamentos = [];
    while ($row = $result->fetch_assoc()) {
        $row['valor_total'] = floatval($row['valor_total']);
        $orcamentos[] = $row;
    }
    echo json_encode($orcamentos);
}

// --- 2. CRIAR NOVO ORÇAMENTO (POST) ---
// 🚩 ESTE BLOCO AGORA SÓ SALVA DADOS, NÃO MEXE NO ESTOQUE DE JEITO NENHUM
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $titulo = $data['titulo'] ?? 'Novo Orçamento';
    $cliente = $data['cliente'] ?? 'Não informado';
    $cnpj = $data['cnpj'] ?? '';
    $status = $data['status'] ?? 'Aberto';
    $valor = $data['valor_total'] ?? 0;
    $observacoes = $data['observacoes'] ?? '';
    $usuario_id = isset($data['createdBy']) ? intval($data['createdBy']) : null;

    $stmt = $conn->prepare("INSERT INTO orcamentos (titulo, cliente, cnpj, status, valor_total, observacoes, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssdsi", $titulo, $cliente, $cnpj, $status, $valor, $observacoes, $usuario_id);

    if ($stmt->execute()) {
        $orcamento_id = $conn->insert_id;

        // Salva os itens para saber o que foi orçado, mas sem dar o comando de UPDATE no estoque
        if (isset($data['items']) && is_array($data['items'])) {
            foreach ($data['items'] as $item) {
                $prod_cod = $item['codigo'] ?? '';
                $qtd = floatval($item['quantidade'] ?? 0);
                if (!empty($prod_cod) && $qtd > 0) {
                    $stmt_item = $conn->prepare("INSERT INTO itens_orcamento (orcamento_id, produto_codigo, quantidade) VALUES (?, ?, ?)");
                    $stmt_item->bind_param("isd", $orcamento_id, $prod_cod, $qtd);
                    $stmt_item->execute();
                }
            }
        }
        echo json_encode(["success" => true, "id" => $orcamento_id]);
    } else {
        echo json_encode(["success" => false, "error" => $conn->error]);
    }
}

// --- 3. ATUALIZAR KANBAN (PUT) ---
// 🚩 É AQUI QUE A RESERVA ACONTECE OU É DESFEITA
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    $novo_status = $data['status'];
    $titulo = $data['titulo'] ?? '';
    $cliente = $data['cliente'] ?? '';
    $valor = $data['valor_total'] ?? 0;

    // A. Precisamos saber o status anterior para decidir se reserva ou devolve
    $stmt_old = $conn->prepare("SELECT status FROM orcamentos WHERE id = ?");
    $stmt_old->bind_param("i", $id);
    $stmt_old->execute();
    $old_status = $stmt_old->get_result()->fetch_assoc()['status'] ?? '';

    // B. Atualiza o card no banco
    $stmt = $conn->prepare("UPDATE orcamentos SET status = ?, titulo = ?, cliente = ?, valor_total = ? WHERE id = ?");
    $stmt->bind_param("ssssdi", $novo_status, $titulo, $cliente, $valor, $id);

    if ($stmt->execute()) {

        // 🚩 REGRA 1: Se moveu para 'Ganho' agora -> Aumenta a reserva
        if ($old_status !== 'Ganho' && $novo_status === 'Ganho') {
            $sql_itens = "SELECT produto_codigo, quantidade FROM itens_orcamento WHERE orcamento_id = ?";
            $stmt_itens = $conn->prepare($sql_itens);
            $stmt_itens->bind_param("i", $id);
            $stmt_itens->execute();
            $result = $stmt_itens->get_result();
            while ($item = $result->fetch_assoc()) {
                $stmt_stock = $conn->prepare("UPDATE produtos SET quantidade_reservada = quantidade_reservada + ? WHERE codigo = ?");
                $stmt_stock->bind_param("ds", $item['quantidade'], $item['produto_codigo']);
                $stmt_stock->execute();
            }
        }
        // 🚩 REGRA 2: Se saiu de 'Ganho' (voltou pra negociação ou aberto) -> Diminui a reserva
        else if ($old_status === 'Ganho' && $novo_status !== 'Ganho') {
            $sql_itens = "SELECT produto_codigo, quantidade FROM itens_orcamento WHERE orcamento_id = ?";
            $stmt_itens = $conn->prepare($sql_itens);
            $stmt_itens->bind_param("i", $id);
            $stmt_itens->execute();
            $result = $stmt_itens->get_result();
            while ($item = $result->fetch_assoc()) {
                $stmt_stock = $conn->prepare("UPDATE produtos SET quantidade_reservada = quantidade_reservada - ? WHERE codigo = ?");
                $stmt_stock->bind_param("ds", $item['quantidade'], $item['produto_codigo']);
                $stmt_stock->execute();
            }
        }
        echo json_encode(["message" => "Status atualizado com sucesso!"]);
    } else {
        echo json_encode(["error" => $conn->error]);
    }
}

// --- 4. EXCLUIR (DELETE) ---
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;

    if ($id) {
        // Antes de apagar, vemos se ele estava em 'Ganho' para devolver o estoque
        $stmt_old = $conn->prepare("SELECT status FROM orcamentos WHERE id = ?");
        $stmt_old->bind_param("i", $id);
        $stmt_old->execute();
        $status_atual = $stmt_old->get_result()->fetch_assoc()['status'] ?? '';

        if ($status_atual === 'Ganho') {
            $sql_itens = "SELECT produto_codigo, quantidade FROM itens_orcamento WHERE orcamento_id = ?";
            $stmt_itens = $conn->prepare($sql_itens);
            $stmt_itens->bind_param("i", $id);
            $stmt_itens->execute();
            $result_itens = $stmt_itens->get_result();
            while ($item = $result_itens->fetch_assoc()) {
                $update_estoque = "UPDATE produtos SET quantidade_reservada = quantidade_reservada - ? WHERE codigo = ?";
                $stmt_update = $conn->prepare($update_estoque);
                $stmt_update->bind_param("ds", $item['quantidade'], $item['produto_codigo']);
                $stmt_update->execute();
            }
        }

        // Limpa as tabelas
        $conn->query("DELETE FROM itens_orcamento WHERE orcamento_id = $id");
        $stmt_del = $conn->prepare("DELETE FROM orcamentos WHERE id = ?");
        $stmt_del->bind_param("i", $id);

        if ($stmt_del->execute()) {
            echo json_encode(["success" => true, "message" => "Excluído com sucesso!"]);
        }
    }
}

$conn->close();
?>