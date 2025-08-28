<?php
echo "<h1>Test EXCO Image Access</h1>";

// Test specific EXCO images
$testImages = [
    'https://exco.kesug.com/images/exco/mohd-azam.jpg',
    'https://exco.kesug.com/images/exco/chief-minister.jpg',
    'https://exco.kesug.com/images/exco/siti-ashah.jpg',
    'https://exco.kesug.com/images/exco/haim-hilman.jpg',
    'https://exco.kesug.com/images/exco/halimaton.jpg'
];

foreach ($testImages as $imageUrl) {
    echo "<hr>";
    echo "<h3>Testing: {$imageUrl}</h3>";
    
    // Test if URL is accessible
    $headers = @get_headers($imageUrl);
    if ($headers && strpos($headers[0], '200') !== false) {
        echo "<p>✅ Image accessible (HTTP 200)</p>";
        echo "<img src='{$imageUrl}' style='width: 200px; height: 200px; object-fit: cover; border: 2px solid green;' alt='Test Image'>";
    } else {
        echo "<p>❌ Image not accessible</p>";
        echo "<p>Headers: " . print_r($headers, true) . "</p>";
        
        // Try alternative paths
        $alternativePaths = [
            str_replace('https://exco.kesug.com', 'http://exco.kesug.com', $imageUrl),
            str_replace('exco.kesug.com', 'exco.kesug.com', $imageUrl),
            str_replace('/images/exco/', '/public/images/exco/', $imageUrl)
        ];
        
        echo "<p>🔍 Trying alternative paths:</p>";
        foreach ($alternativePaths as $altPath) {
            $altHeaders = @get_headers($altPath);
            if ($altHeaders && strpos($altHeaders[0], '200') !== false) {
                echo "<p>✅ Alternative path works: {$altPath}</p>";
                echo "<img src='{$altPath}' style='width: 200px; height: 200px; object-fit: cover; border: 2px solid blue;' alt='Alternative Image'>";
                break;
            } else {
                echo "<p>❌ Alternative path failed: {$altPath}</p>";
            }
        }
    }
}

echo "<hr>";
echo "<h2>Quick Fix Options</h2>";
echo "<p>1. <strong>Check if images exist</strong> at the expected paths</p>";
echo "<p>2. <strong>Verify file permissions</strong> on the server</p>";
echo "<p>3. <strong>Check .htaccess</strong> for image access rules</p>";
echo "<p>4. <strong>Test direct access</strong> to image URLs in browser</p>";
?>
