<?php
// atualizar_status.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$conn = new mysqli("localhost", "root", "", "polibalbino_db");

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['id']) && isset($data['status'])) {
    $id = $data['id'];
    $novo_status = $data['status'];

    // 1. Antes de atualizar, precisamos saber o status antigo para decidir se reserva ou devolve
    $stmt_old = $conn->prepare("SELECT status FROM orcamentos WHERE id = ?");
    $stmt_old->bind_param("i", $id);
    $stmt_old->execute();
    $res_old = $stmt_old->get_result();
    $old_status = $res_old->fetch_assoc()['status'] ?? '';

    // 2. Atualiza o status do orçamento no banco (para o card mover na tela)
    $sql = "UPDATE orcamentos SET status = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $novo_status, $id);

    if ($stmt->execute()) {

        // 🚩 LÓGICA DE ESTOQUE: Entrou na coluna Ganho agora?
        if ($old_status !== 'Ganho' && $novo_status === 'Ganho') {
            $sql_itens = "SELECT produto_codigo, quantidade FROM itens_orcamento WHERE orcamento_id = ?";
            $stmt_itens = $conn->prepare($sql_itens);
            $stmt_itens->bind_param("i", $id);
            $stmt_itens->execute();
            $result = $stmt_itens->get_result();

            while ($item = $result->fetch_assoc()) {
                $upd = $conn->prepare("UPDATE produtos SET quantidade_reservada = quantidade_reservada + ? WHERE codigo = ?");
                $upd->bind_param("ds", $item['quantidade'], $item['produto_codigo']);
                $upd->execute();
            }
        }

        // 🚩 LÓGICA DE ESTOQUE: Saiu da coluna Ganho (voltou pra Aberto/Negociação)?
        else if ($old_status === 'Ganho' && $novo_status !== 'Ganho') {
            $sql_itens = "SELECT produto_codigo, quantidade FROM itens_orcamento WHERE orcamento_id = ?";
            $stmt_itens = $conn->prepare($sql_itens);
            $stmt_itens->bind_param("i", $id);
            $stmt_itens->execute();
            $result = $stmt_itens->get_result();

            while ($item = $result->fetch_assoc()) {
                $upd = $conn->prepare("UPDATE produtos SET quantidade_reservada = quantidade_reservada - ? WHERE codigo = ?");
                $upd->bind_param("ds", $item['quantidade'], $item['produto_codigo']);
                $upd->execute();
            }
        }

        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["error" => $conn->error]);
    }
}
$conn->close();
?>