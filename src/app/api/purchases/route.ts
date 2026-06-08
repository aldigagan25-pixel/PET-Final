import { authOptions } from "@/lib/authOptions";
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session || session.user?.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const supplierName = String(formData.get('supplier') ?? '').trim()
    const metodePembayaran = String(formData.get('metodePembayaran') ?? '').trim()
    const itemsRaw = formData.get('items')
    const foto = formData.get('foto') as File | null

    if (!supplierName) return NextResponse.json({ error: 'Supplier is required' }, { status: 400 })
    if (!itemsRaw || typeof itemsRaw !== 'string') return NextResponse.json({ error: 'Items are required' }, { status: 400 })

    let items: { sku: string; berat: number; hargaPerKg: number }[] = []
    try {
      const parsed = JSON.parse(itemsRaw)
      if (!Array.isArray(parsed)) throw new Error('Invalid items format')
      items = parsed.map((it: any) => ({
        sku: String(it.sku ?? ''),
        berat: Number(it.berat ?? 0),
        hargaPerKg: Number(it.hargaPerKg ?? 0),
      }))
    } catch (err) {
      return NextResponse.json({ error: 'Invalid items JSON' }, { status: 400 })
    }

    // Handle optional file upload
    let fotoUrl: string | null = null
    if (foto && typeof (foto as any).arrayBuffer === 'function') {
      const bytes = await foto.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadDir, { recursive: true })
      const filename = `${Date.now()}-${(foto as any).name ?? 'upload'}`
      const filepath = path.join(uploadDir, filename)
      await writeFile(filepath, buffer)
      fotoUrl = `/uploads/${filename}`
    }

    // Cari atau buat supplier baru
    let supplier = await prisma.supplier.findFirst({ where: { nama: supplierName } })
    if (!supplier) {
      supplier = await prisma.supplier.create({ data: { nama: supplierName } })
    }

    // Hitung total nilai
    let totalNilai = 0
    for (const item of items) {
      totalNilai += item.berat * item.hargaPerKg
    }

    // Generate nomor nota sederhana
    const nomorNota = `INV/${Date.now()}`

    // Simpan purchase
    const purchase = await prisma.purchase.create({
      data: {
        nomor_nota: nomorNota,
        supplierId: supplier.id,
        warehouseId: session.user.warehouseId || '', // Assuming warehouseId is available in session or we need to fetch it
        userIdStaff: session.user.id as string,
        metode_pembayaran_terpilih: metodePembayaran,
        total_nilai_sebelum_retur: totalNilai,
        status_approval: 'menunggu_double_cek',
        items: {
          create: items.map(item => ({
            sku_name: item.sku,
            berat_final_item: item.berat,
            harga_per_kg: item.hargaPerKg,
            subtotal: item.berat * item.hargaPerKg,
          })),
        },
      },
    })

    return NextResponse.json({ success: true, purchaseId: purchase.id })
  } catch (error) {
    console.error('Error in purchases route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}