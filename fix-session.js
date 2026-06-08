const fs = require('fs')
const path = require('path')

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f)
    let isDirectory = fs.statSync(dirPath).isDirectory()
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f))
  })
}

walkDir(path.join(__dirname, 'src'), function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8')
    if (content.includes('getServerSession()')) {
      content = content.replace(/getServerSession\(\)/g, 'getServerSession(authOptions)')
      
      if (!content.includes('authOptions')) {
        // Add import
        const importStatement = `import { authOptions } from "@/lib/authOptions"\n`
        
        // find last import and insert after
        const lines = content.split('\n')
        let lastImportIdx = -1
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            lastImportIdx = i
          }
        }
        
        if (lastImportIdx !== -1) {
          lines.splice(lastImportIdx + 1, 0, importStatement)
          content = lines.join('\n')
        } else {
          content = importStatement + content
        }
      }
      fs.writeFileSync(filePath, content)
      console.log('Fixed', filePath)
    }
  }
})
