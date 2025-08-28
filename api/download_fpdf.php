<?php
echo "=== DOWNLOADING FPDF LIBRARY ===\n\n";

// Create fpdf directory
$fpdfDir = 'fpdf/';
if (!is_dir($fpdfDir)) {
    mkdir($fpdfDir, 0755, true);
    echo "✅ Created fpdf directory\n";
} else {
    echo "✅ fpdf directory already exists\n";
}

// Download FPDF files
$fpdfFiles = [
    'fpdf.php' => 'https://raw.githubusercontent.com/Setasign/FPDF/master/fpdf.php',
    'font/helveticab.php' => 'https://raw.githubusercontent.com/Setasign/FPDF/master/font/helveticab.php',
    'font/helveticai.php' => 'https://raw.githubusercontent.com/Setasign/FPDF/master/font/helveticai.php',
    'font/helvetica.php' => 'https://raw.githubusercontent.com/Setasign/FPDF/master/font/helvetica.php',
    'font/symbol.php' => 'https://raw.githubusercontent.com/Setasign/FPDF/master/font/symbol.php',
    'font/timesb.php' => 'https://raw.githubusercontent.com/Setasign/FPDF/master/font/timesb.php',
    'font/timesbi.php' => 'https://raw.githubusercontent.com/Setasign/FPDF/master/font/timesbi.php',
    'font/timesi.php' => 'https://raw.githubusercontent.com/Setasign/FPDF/master/font/timesi.php',
    'font/times.php' => 'https://raw.githubusercontent.com/Setasign/FPDF/master/font/times.php',
    'font/zapfdingbats.php' => 'https://raw.githubusercontent.com/Setasign/FPDF/master/font/zapfdingbats.php'
];

// Create font directory
$fontDir = $fpdfDir . 'font/';
if (!is_dir($fontDir)) {
    mkdir($fontDir, 0755, true);
    echo "✅ Created font directory\n";
}

$downloadedCount = 0;
foreach ($fpdfFiles as $filename => $url) {
    $filepath = $fpdfDir . $filename;
    
    if (file_exists($filepath)) {
        echo "✅ {$filename} already exists\n";
        $downloadedCount++;
        continue;
    }
    
    echo "Downloading {$filename}...\n";
    $content = file_get_contents($url);
    
    if ($content !== false) {
        file_put_contents($filepath, $content);
        echo "✅ Downloaded {$filename}\n";
        $downloadedCount++;
    } else {
        echo "❌ Failed to download {$filename}\n";
    }
}

echo "\n=== DOWNLOAD SUMMARY ===\n";
echo "Total files: " . count($fpdfFiles) . "\n";
echo "Successfully downloaded: {$downloadedCount}\n";

if ($downloadedCount === count($fpdfFiles)) {
    echo "✅ FPDF library installation complete!\n";
    echo "You can now use FPDF for PDF generation.\n";
} else {
    echo "⚠️ Some files failed to download. Please check your internet connection.\n";
}
?> 