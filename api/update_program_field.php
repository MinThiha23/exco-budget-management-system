<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    // Accept both GET and POST for simplicity
    $data = [];
    if ($method === 'POST') {
        // Support JSON and form-data
        $raw = file_get_contents('php://input');
        $json = json_decode($raw, true);
        if (is_array($json)) {
            $data = $json;
        } else {
            $data = $_POST ?? [];
        }
    } else {
        $data = $_GET ?? [];
    }

    $id = $data['id'] ?? null;
    $field = $data['field'] ?? 'letter_reference_number';
    $value = $data['value'] ?? ($data['letter_reference_number'] ?? null);

    if (!$id || !$field) {
        http_response_code(400);
        echo json_encode(['error' => 'Program ID and field are required']);
        exit;
    }

    // Allowlist of simple fields
    $allowed = [
        'letter_reference_number',
        'title', 'description', 'department', 'recipient_name',
        'budget', 'start_date', 'end_date', 'submitted_by'
    ];
    if (!in_array($field, $allowed, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Field not allowed']);
        exit;
    }

    $pdo = getConnection();
    $stmt = $pdo->prepare("UPDATE programs SET {$field} = ? WHERE id = ?");
    $stmt->execute([$value, $id]);

    $stmt = $pdo->prepare("SELECT id, {$field} FROM programs WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'program' => $row]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}
?>


