<?php
require_once 'config.php';

header('Content-Type: application/json');

$status = [
    'php' => 'ok',
    'db' => 'fail',
    'origin' => $_SERVER['HTTP_ORIGIN'] ?? null,
];

try {
    $pdo = getConnection();
    $stmt = $pdo->query('SELECT 1 as ok');
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ((int)($row['ok'] ?? 0) === 1) {
        $status['db'] = 'ok';
    }
    http_response_code(200);
    echo json_encode(['success' => true, 'status' => $status]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'status' => $status,
        'error' => 'DB connection failed',
        'message' => ENVIRONMENT === 'production' ? 'error' : $e->getMessage(),
    ]);
}
?>

<?php
require_once 'config.php';

// Test API connection and show current data
echo "<h2>API Connection Test</h2>";

try {
    $pdo = getConnection();
    echo "<p>✅ Database connection successful</p>";
    
    // Test users
    echo "<h3>Current Users:</h3>";
    $stmt = $pdo->query("SELECT id, name, email, role FROM users");
    $users = $stmt->fetchAll();
    
    if (count($users) > 0) {
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr>";
        foreach ($users as $user) {
            echo "<tr>";
            echo "<td>{$user['id']}</td>";
            echo "<td>{$user['name']}</td>";
            echo "<td>{$user['email']}</td>";
            echo "<td>{$user['role']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>❌ No users found in database</p>";
    }
    
    // Test programs
    echo "<h3>Current Programs:</h3>";
    $stmt = $pdo->query("SELECT id, title, status, budget FROM programs");
    $programs = $stmt->fetchAll();
    
    if (count($programs) > 0) {
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Title</th><th>Status</th><th>Budget</th></tr>";
        foreach ($programs as $program) {
            echo "<tr>";
            echo "<td>{$program['id']}</td>";
            echo "<td>{$program['title']}</td>";
            echo "<td>{$program['status']}</td>";
            echo "<td>RM " . number_format($program['budget'], 2) . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>❌ No programs found in database</p>";
    }
    
    echo "<h3>API Endpoints Test:</h3>";
    echo "<ul>";
    echo "<li><a href='auth.php' target='_blank'>Test Auth API</a></li>";
    echo "<li><a href='programs.php' target='_blank'>Test Programs API</a></li>";
    echo "<li><a href='users.php' target='_blank'>Test Users API</a></li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p>❌ Database connection failed: " . $e->getMessage() . "</p>";
}
?> 