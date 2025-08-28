<?php
require_once 'config.php';

// Test remark functionality
echo "<h2>Test Remark Functionality</h2>";

try {
    $pdo = getConnection();
    echo "<p>✅ Database connection successful</p>";
    
    // Test with a finance user
    $testEmail = 'finance@gmail.com';
    $testPassword = 'password123';
    
    // Get the finance user
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
    $stmt->execute([$testEmail]);
    $user = $stmt->fetch();
    
    if ($user) {
        echo "<p>✅ Test user found: {$user['name']} (ID: {$user['id']})</p>";
        echo "<p>Role: {$user['role']}</p>";
        
        // Test password verification
        if (password_verify($testPassword, $user['password'])) {
            echo "<p>✅ Password verification successful</p>";
            
            // Simulate the remark data that would be sent from frontend
            $testData = [
                'action' => 'addRemark',
                'program_id' => '1', // Test program ID
                'remarked_by' => $user['id'], // User ID as integer
                'remark_text' => 'Test remark from finance user'
            ];
            
            echo "<h3>Test Data:</h3>";
            echo "<pre>" . json_encode($testData, JSON_PRETTY_PRINT) . "</pre>";
            
            // Test the addRemark function logic
            $programId = $testData['program_id'];
            $remarkText = $testData['remark_text'];
            $remarkedBy = $testData['remarked_by'];
            
            echo "<h3>Processing:</h3>";
            echo "<p>Program ID: $programId</p>";
            echo "<p>Remark Text: $remarkText</p>";
            echo "<p>Remarked By: $remarkedBy</p>";
            
            // Convert to integers
            $programId = (int)$programId;
            $remarkedBy = (int)$remarkedBy;
            
            echo "<p>After conversion - Program ID: $programId, Remarked By: $remarkedBy</p>";
            
            if (!$remarkedBy || $remarkedBy <= 0) {
                echo "<p>❌ Error: remarked_by is missing, invalid, or zero</p>";
            } else {
                echo "<p>✅ remarked_by is valid</p>";
                
                // Check if program exists
                $checkStmt = $pdo->prepare("SELECT id FROM programs WHERE id = ?");
                $checkStmt->execute([$programId]);
                if ($checkStmt->fetch()) {
                    echo "<p>✅ Program exists</p>";
                    
                    // Check if user exists
                    $userStmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
                    $userStmt->execute([$remarkedBy]);
                    if ($userStmt->fetch()) {
                        echo "<p>✅ User exists</p>";
                        
                        // Test inserting the remark
                        $stmt = $pdo->prepare("
                            INSERT INTO program_remarks (program_id, remarked_by, remark_text)
                            VALUES (?, ?, ?)
                        ");
                        
                        $result = $stmt->execute([$programId, $remarkedBy, $remarkText]);
                        
                        if ($result) {
                            echo "<p>✅ Test remark inserted successfully!</p>";
                            
                            // Show the inserted remark
                            $stmt = $pdo->query("SELECT * FROM program_remarks ORDER BY id DESC LIMIT 1");
                            $remark = $stmt->fetch();
                            
                            echo "<h3>Inserted Remark:</h3>";
                            echo "<pre>" . json_encode($remark, JSON_PRETTY_PRINT) . "</pre>";
                        } else {
                            echo "<p>❌ Failed to insert test remark</p>";
                        }
                    } else {
                        echo "<p>❌ User not found with ID: $remarkedBy</p>";
                    }
                } else {
                    echo "<p>❌ Program not found with ID: $programId</p>";
                }
            }
            
        } else {
            echo "<p>❌ Password verification failed</p>";
        }
    } else {
        echo "<p>❌ Test user not found</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?> 