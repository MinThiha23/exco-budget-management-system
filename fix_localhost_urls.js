import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find all .tsx and .ts files
function findFiles(dir, extensions = ['.tsx', '.ts']) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });

  return results;
}

// Function to replace localhost URLs with API_ENDPOINTS
function replaceLocalhostUrls(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if file already imports API_ENDPOINTS
  const hasApiImport = content.includes('API_ENDPOINTS');

  // Replace patterns
  const replacements = [
    {
      from: /fetch\('http:\/\/localhost:8000\/programs\.php\?action=([^']+)'/g,
      to: 'fetch(`${API_ENDPOINTS.PROGRAMS}?action=$1`',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/messaging\.php'/g,
      to: 'fetch(API_ENDPOINTS.MESSAGING',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/exco_users\.php'/g,
      to: 'fetch(API_ENDPOINTS.EXCO_USERS',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/upload\.php'/g,
      to: 'fetch(API_ENDPOINTS.UPLOAD',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/upload_profile_photo\.php'/g,
      to: 'fetch(API_ENDPOINTS.UPLOAD_PROFILE',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/fpdf_government_report\.php'/g,
      to: 'fetch(API_ENDPOINTS.FPDF_GOVERNMENT',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/auth\.php'/g,
      to: 'fetch(API_ENDPOINTS.AUTH',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/users\.php'/g,
      to: 'fetch(API_ENDPOINTS.USERS',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/notifications\.php'/g,
      to: 'fetch(API_ENDPOINTS.NOTIFICATIONS',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/budget\.php'/g,
      to: 'fetch(API_ENDPOINTS.BUDGET',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/reports\.php'/g,
      to: 'fetch(API_ENDPOINTS.REPORTS',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/dashboard\.php'/g,
      to: 'fetch(API_ENDPOINTS.DASHBOARD',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/activity\.php'/g,
      to: 'fetch(API_ENDPOINTS.ACTIVITY',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/approvals\.php'/g,
      to: 'fetch(API_ENDPOINTS.APPROVALS',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/update_user\.php'/g,
      to: 'fetch(API_ENDPOINTS.UPDATE_USER',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/change_password\.php'/g,
      to: 'fetch(API_ENDPOINTS.CHANGE_PASSWORD',
      requiresImport: true
    },
    {
      from: /fetch\('http:\/\/localhost:8000\/update_email\.php'/g,
      to: 'fetch(API_ENDPOINTS.UPDATE_EMAIL',
      requiresImport: true
    },
    {
      from: /href=\{`http:\/\/localhost:8000\/download\.php\?file=([^`]+)`\}/g,
      to: 'href={`${API_ENDPOINTS.DOWNLOAD}?file=$1`}',
      requiresImport: true
    },
    {
      from: /window\.open\(`http:\/\/localhost:8000\/download\.php\?file=([^`]+)`, '_blank'\)/g,
      to: 'window.open(`${API_ENDPOINTS.DOWNLOAD}?file=$1`, \'_blank\')',
      requiresImport: true
    },
    {
      from: /src=\{`http:\/\/localhost:8000\/([^`]+)`\}/g,
      to: 'src={`${API_ENDPOINTS.AUTH.replace(\'/auth.php\', \'\')}/$1`}',
      requiresImport: true
    }
  ];

  replacements.forEach(replacement => {
    if (replacement.from.test(content)) {
      content = content.replace(replacement.from, replacement.to);
      modified = true;

      if (replacement.requiresImport && !hasApiImport) {
        // Add import statement
        const importStatement = "import { API_ENDPOINTS } from '../../config/api';";
        const lastImportIndex = content.lastIndexOf('import');
        if (lastImportIndex !== -1) {
          const nextLineIndex = content.indexOf('\n', lastImportIndex);
          if (nextLineIndex !== -1) {
            content = content.slice(0, nextLineIndex + 1) + importStatement + '\n' + content.slice(nextLineIndex + 1);
          }
        }
      }
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} TypeScript/React files`);
console.log('Starting URL replacement...');

files.forEach(file => {
  try {
    replaceLocalhostUrls(file);
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log('URL replacement completed!');
