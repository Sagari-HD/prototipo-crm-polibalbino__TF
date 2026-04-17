<?php
// Configurações de Cabeçalho para permitir acesso do React (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Responde a requisições de pré-venda (Pre-flight) do navegador
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Conexão com o banco de dados da Polibalbino
$conn = new mysqli("localhost", "root", "", "polibalbino_db");

if ($conn->connect_error) {
    die(json_encode(["error" => "Falha na conexão: " . $conn->connect_error]));
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // --- LISTAR PRODUTOS (Read) ---
    case 'GET':
        // Calculamos o 'disponivel' subtraindo a reserva do total direto no SQL
        $sql = "SELECT *, (quantidade_total - quantidade_reservada) as disponivel FROM produtos ORDER BY descricao ASC";
        $result = $conn->query($sql);
        $produtos = [];

        while ($row = $result->fetch_assoc()) {
            $produtos[] = $row;
        }
        echo json_encode($produtos);
        break;

    // --- CADASTRAR PRODUTO (Create) ---
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        // Usamos "ssdds" -> string, string, double, double, string
        $stmt = $conn->prepare("INSERT INTO produtos (codigo, descricao, preco_quilo, quantidade_total, linha) VALUES (?, ?, ?, ?, ?)");

        // Garantimos que os valores numéricos sejam convertidos corretamente
        $preco = floatval($data['preco_quilo']);
        $qtd = floatval($data['quantidade_total']);

        $stmt->bind_param("ssdds", $data['codigo'], $data['descricao'], $preco, $qtd, $data['linha']);

        if ($stmt->execute()) {
            echo json_encode(["message" => "sucesso", "id" => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => $conn->error]);
        }
        break;

    // --- EDITAR PRODUTO (Update) ---
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);

        // Ordem: codigo(s), descricao(s), preco(d), qtd(d), linha(s), id(i) -> "ssddsi"
        $stmt = $conn->prepare("UPDATE produtos SET codigo=?, descricao=?, preco_quilo=?, quantidade_total=?, linha=? WHERE id=?");

        $preco = floatval($data['preco_quilo']);
        $qtd = floatval($data['quantidade_total']);
        $id = intval($data['id']);

        $stmt->bind_param("ssddsi", $data['codigo'], $data['descricao'], $preco, $qtd, $data['linha'], $id);

        if ($stmt->execute()) {
            echo json_encode(["message" => "atualizado"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => $conn->error]);
        }
        break;

    // --- EXCLUIR PRODUTO (Delete) ---
    case 'DELETE':
        // Pega o ID via URL (ex: produtos.php?id=5)
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            $stmt = $conn->prepare("DELETE FROM produtos WHERE id = ?");
            $stmt->bind_param("i", $id);

            if ($stmt->execute()) {
                echo json_encode(["message" => "Produto removido com sucesso!"]);
            } else {
                echo json_encode(["error" => "Erro ao remover produto."]);
            }
        }
        break;
}

$conn->close();
?>