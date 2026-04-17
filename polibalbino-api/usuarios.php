<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Conexão com o banco
$conn = new mysqli("localhost", "root", "", "polibalbino_db");

if ($conn->connect_error) {
    die(json_encode(["error" => "Falha na conexão: " . $conn->connect_error]));
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    // --- READ (Listar usuários) ---
    case 'GET':
        $sql = "SELECT id, nome as name, email, cargo as role FROM usuarios";
        $result = $conn->query($sql);
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        echo json_encode($users);
        break;

    // --- CREATE (Cadastrar novo usuário) ---
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $conn->prepare("INSERT INTO usuarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $data['name'], $data['email'], $data['password'], $data['role']);

        if ($stmt->execute()) {
            echo json_encode(["message" => "Usuário criado!", "id" => $conn->insert_id]);
        } else {
            echo json_encode(["error" => "Erro ao criar: " . $conn->error]);
        }
        break;

    // --- UPDATE (Editar dados do usuário) ---
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $conn->prepare("UPDATE usuarios SET nome=?, email=?, cargo=? WHERE id=?");
        $stmt->bind_param("sssi", $data['name'], $data['email'], $data['role'], $data['id']);

        if ($stmt->execute()) {
            echo json_encode(["message" => "Usuário atualizado!"]);
        } else {
            echo json_encode(["error" => "Erro ao atualizar"]);
        }
        break;

    // --- DELETE (Remover usuário) ---
    case 'DELETE':
        $id = $_GET['id'];
        $stmt = $conn->prepare("DELETE FROM usuarios WHERE id=?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(["message" => "Usuário removido!"]);
        } else {
            echo json_encode(["error" => "Erro ao remover"]);
        }
        break;
}

$conn->close();
?>