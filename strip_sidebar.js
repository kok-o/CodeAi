import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src', 'pages');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove <Sidebar />
  content = content.replace(/<Sidebar \/>/g, '');
  
  // Remove import Sidebar
  content = content.replace(/import Sidebar from ['"]\.\.\/components\/Sidebar['"];?/g, '');
  content = content.replace(/import Sidebar from ['"]\.\.\/components\/Sidebar\.jsx['"];?/g, '');

  // Remove paddingLeft: '260px' or '120px' or isCollapsed logic from main/div styles
  content = content.replace(/paddingLeft:\s*isCollapsed\s*\?\s*['"]120px['"]\s*:\s*['"]260px['"]/g, "paddingLeft: 0");
  content = content.replace(/paddingLeft:\s*['"]260px['"]/g, "paddingLeft: 0");
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${file}`);
});
