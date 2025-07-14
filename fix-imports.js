const fs = require('fs');
const path = require('path');

// Function to convert @/ imports to relative imports
function fixImports(filePath, content) {
  const relativePath = path.relative(path.dirname(filePath), 'backend');
  const relativePrefix = relativePath ? relativePath + '/' : './';
  
  // Replace @/ with relative path
  const fixedContent = content.replace(/@\//g, relativePrefix);
  
  return fixedContent;
}

// Function to recursively process files
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes('@/')) {
        console.log(`Fixing imports in: ${filePath}`);
        const fixedContent = fixImports(filePath, content);
        fs.writeFileSync(filePath, fixedContent);
      }
    }
  });
}

// Process backend directory
console.log('Fixing import paths...');
processDirectory('backend');
console.log('Import paths fixed!');
