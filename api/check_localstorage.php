<?php
// Simple script to check localStorage data
echo "<h2>Check localStorage Data</h2>";
echo "<p>This script will help you check what user data is stored in your browser's localStorage.</p>";
echo "<p>Please run this JavaScript in your browser console:</p>";
echo "<pre>";
echo "console.log('localStorage authUser:', localStorage.getItem('authUser'));";
echo "console.log('Parsed user data:', JSON.parse(localStorage.getItem('authUser') || 'null'));";
echo "</pre>";
echo "<p>Or you can check manually:</p>";
echo "<ol>";
echo "<li>Open browser console (F12)</li>";
echo "<li>Type: <code>localStorage.getItem('authUser')</code></li>";
echo "<li>Press Enter</li>";
echo "<li>Tell me what it shows</li>";
echo "</ol>";
?>
