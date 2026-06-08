const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const p = new PrismaClient()

async function main() {
  // Cek apakah ada user
  const users = await p.user.findMany({
    select: { email: true, role: true, password: true }
  })
  
  console.log('=== USERS IN DATABASE ===')
  console.log('Total:', users.length)
  
  if (users.length === 0) {
    console.log('❌ Database KOSONG! Perlu di-seed ulang.')
    return
  }
  
  for (const u of users) {
    console.log(`\nEmail: ${u.email}`)
    console.log(`Role: ${u.role}`)
    console.log(`Password hash: ${u.password.substring(0, 20)}...`)
    
    // Verify password
    const valid = await bcrypt.compare('password123', u.password)
    console.log(`Password 'password123' valid: ${valid ? '✅ YES' : '❌ NO'}`)
  }
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => p.$disconnect())
