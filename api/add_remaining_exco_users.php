<?php
require_once 'config.php';

// Add remaining EXCO users to complete the full list
echo "<h2>Add Remaining EXCO Users</h2>";

try {
    $pdo = getConnection();
    echo "<p>✅ Database connection successful</p>";
    
    // Check current count
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM exco_users");
    $result = $stmt->fetch();
    $currentCount = $result['count'];
    
    echo "<p>📊 Current EXCO users in database: $currentCount</p>";
    
    // Add the remaining 8 EXCO users
    $remainingExcoUsers = [
        [
            'name' => 'YB. Prof. Dr. Haim Hilman Bin Abdullah, AMK.',
            'title' => 'Member of the Kedah State Government Council',
            'role' => 'Chairman of the Industry & Investment, Higher Education and Science, Technology & Innovation Committees',
            'image_url' => '/images/exco/haim-hilman.jpg',
            'email' => 'haimhilman@kedah.gov.my',
            'phone' => '04-702 7703 (No.Tel)',
            'department' => 'Industry & Investment Department',
            'position' => 'EXCO Member'
        ],
        [
            'name' => 'YB. Dato\' Hjh. Halimaton Shaadiah Binti Saad, DSSS., SSS., BKM.',
            'title' => 'Member of the Kedah State Government Council',
            'role' => 'Chairman of the Welfare, Women, Family & Community Solidarity Committee',
            'image_url' => '/images/exco/halimaton.jpg',
            'email' => 'halimatonsaadiah@kedah.gov',
            'phone' => '04-702 7705 (No.Tel)',
            'department' => 'Welfare Department',
            'position' => 'EXCO Member'
        ],
        [
            'name' => 'YB DATO\' HJ. MOHAMAD YUSOFF BIN HJ. ZAKARIA., DSSS., SSS., AMK., BKM.',
            'title' => 'Member of the Kedah State Government Council',
            'role' => 'Chairman of the Public Works, Natural Resources, Water Supply, Water Resources and Environment Committee',
            'image_url' => '/images/exco/mohamad-yusoff.jpg',
            'email' => 'myusoff@kedah.gov.my',
            'phone' => '04-702 7709 (No.Tel)',
            'department' => 'Public Works Department',
            'position' => 'EXCO Member'
        ],
        [
            'name' => 'YB. Major (Rtd) Mansor Bin Zakaria, AMK., PCK., PNBB., PPS',
            'title' => 'Member of the Kedah State Government Council',
            'role' => 'Chairman of the Housing, Local Government, Health Committee',
            'image_url' => '/images/exco/mansor.jpg',
            'email' => 'mansorzakaria@kedah.gov.my',
            'phone' => '04-702 7713 (No.Tel)',
            'department' => 'Housing Department',
            'position' => 'EXCO Member'
        ],
        [
            'name' => 'His Holiness Tuan Haji Dzowahir Bin Haji Ab. Ghani',
            'title' => 'Member of the Kedah State Executive Council',
            'role' => 'Chairman of the Agriculture, Plantation, Transportation Committee',
            'image_url' => '/images/exco/dzowahir.jpg',
            'email' => 'dzowahir@kedah.gov.my',
            'phone' => '04-702 7695 (No.Tel)',
            'department' => 'Agriculture Department',
            'position' => 'EXCO Member'
        ],
        [
            'name' => 'YB. Dato\' Haji Mohd Salleh Bin Saidin, DIMP., DPSM.',
            'title' => 'Member of the Kedah State Government Council',
            'role' => 'Chairman of the Tourism, Culture, Entrepreneurship Committee',
            'image_url' => '/images/exco/mohd-salleh.jpg',
            'email' => 'sallehsaidin@kedah.gov.my',
            'phone' => '04-702 7707 (No.Tel)',
            'department' => 'Tourism Department',
            'position' => 'EXCO Member'
        ],
        [
            'name' => 'YB. Tuan Haji Muhammad Radhi Bin Haji Mat Din, SDK., AMK., ASK., PJK.',
            'title' => 'Member of the Kedah State Government Council',
            'role' => 'Chairman of the Consumerism & Cost of Living, Youth and Sports Committee',
            'image_url' => '/images/exco/muhammad-radhi.jpg',
            'email' => 'muhammadradhi@kedah.gov.my',
            'phone' => '04-702 7699',
            'department' => 'Youth and Sports Department',
            'position' => 'EXCO Member'
        ],
        [
            'name' => 'YB. Wong Chia Zhen',
            'title' => 'Member of the Kedah State Executive Council',
            'role' => 'Chairman of the Human Resources Committee, Chinese, Indian & Siamese Communities & NGOs',
            'image_url' => '/images/exco/wong-chia-zhen.jpg',
            'email' => 'wongchiazhen@kedah.gov.my',
            'phone' => '04-702 7710',
            'department' => 'Human Resources Department',
            'position' => 'EXCO Member'
        ]
    ];
    
    echo "<h3>Adding Remaining EXCO Users...</h3>";
    
    $stmt = $pdo->prepare("
        INSERT INTO exco_users (name, title, role, image_url, email, phone, department, position)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $insertedCount = 0;
    foreach ($remainingExcoUsers as $user) {
        $result = $stmt->execute([
            $user['name'],
            $user['title'],
            $user['role'],
            $user['image_url'],
            $user['email'],
            $user['phone'],
            $user['department'],
            $user['position']
        ]);
        
        if ($result) {
            $insertedCount++;
            echo "<p>✅ Inserted: {$user['name']}</p>";
        } else {
            echo "<p>❌ Failed to insert: {$user['name']}</p>";
        }
    }
    
    echo "<p><strong>Total additional EXCO users inserted: $insertedCount</strong></p>";
    
    // Check final count
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM exco_users");
    $result = $stmt->fetch();
    $finalCount = $result['count'];
    
    echo "<p>📊 Final EXCO users in database: $finalCount</p>";
    
    if ($finalCount == 11) {
        echo "<p>✅ Perfect! All 11 EXCO users are now in the database.</p>";
        
        // Show all EXCO users
        echo "<h3>Complete EXCO Users List:</h3>";
        $stmt = $pdo->query("SELECT id, name, title, role, department FROM exco_users ORDER BY id ASC");
        $allExcoUsers = $stmt->fetchAll();
        
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Name</th><th>Title</th><th>Role</th><th>Department</th></tr>";
        
        foreach ($allExcoUsers as $user) {
            echo "<tr>";
            echo "<td>{$user['id']}</td>";
            echo "<td>{$user['name']}</td>";
            echo "<td>{$user['title']}</td>";
            echo "<td>{$user['role']}</td>";
            echo "<td>{$user['department']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        echo "<p>🎉 All 11 EXCO users have been successfully added! Refresh your frontend to see the complete list.</p>";
        
    } else {
        echo "<p>❌ Expected 11 users, but found $finalCount</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>
