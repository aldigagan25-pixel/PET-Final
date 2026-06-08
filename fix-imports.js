const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if(fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      let c = fs.readFileSync(p, 'utf8');
      if(c.includes('getServerSession(authOptions)') && !c.includes('import { authOptions }')) {
        console.log('Fixing:', p);
        c = 'import { authOptions } from "@/lib/authOptions";\n' + c;
        fs.writeFileSync(p, c);
      }
    }
  });
}
walk('./src');
