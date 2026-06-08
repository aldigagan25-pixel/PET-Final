'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface Item {
  sku: string
  berat: number
  hargaPerKg: number
}

const skuList = ['Bening', 'BM', 'Mix', 'Warna', 'Tutup HD', 'Kotor Grade B', 'Bocil', 'Grade C', 'Saos Kecap', 'Galon', 'Karung']

export default function NewPurchasePage() {
  const router = useRouter()
  const [supplier, setSupplier] = useState('')
  const [metodeBayar, setMetodeBayar] = useState('timbangan_gudang')
  const [items, setItems] = useState<Item[]>([{ sku: '', berat: 0, hargaPerKg: 0 }])
  const [foto, setFoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const addItem = () => setItems(prev => [...prev, { sku: '', berat: 0, hargaPerKg: 0 }])
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: keyof Item, value: string | number) => {
    setItems(currentItems => currentItems.map((item, i) => {
      if (i !== idx) return item

      const updatedValue = field === 'sku' ? String(value) : Number(value)

      return {
        ...item,
        [field]: updatedValue,
      } as Item
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData()
    formData.append('supplier', supplier)
    formData.append('metodePembayaran', metodeBayar)
    formData.append('items', JSON.stringify(items))
    if (foto) formData.append('foto', foto)

    const res = await fetch('/api/purchases', { method: 'POST', body: formData })
    if (res.ok) router.push('/staff/purchases')
    else alert('Gagal menyimpan transaksi')
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Input Transaksi Baru</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Supplier</label>
          <input type="text" className="w-full border p-2 rounded" value={supplier} onChange={e => setSupplier(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium">Metode Pembayaran</label>
          <select className="w-full border p-2 rounded" value={metodeBayar} onChange={e => setMetodeBayar(e.target.value)}>
            <option value="timbangan_gudang">Timbangan Gudang</option>
            <option value="timbangan_lapak">Timbangan Lapak</option>
          </select>
        </div>
        <div className="border-t pt-4">
          <h2 className="font-semibold mb-2">Item Pembelian</h2>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <select className="border p-2 rounded w-1/3" value={item.sku} onChange={e => updateItem(idx, 'sku', e.target.value)} required>
                <option value="">Pilih SKU</option>
                {skuList.map(sku => <option key={sku} value={sku}>{sku}</option>)}
              </select>
              <input type="number" placeholder="Berat (kg)" className="border p-2 rounded w-1/4" value={item.berat} onChange={e => updateItem(idx, 'berat', parseFloat(e.target.value))} required />
              <input type="number" placeholder="Harga/kg" className="border p-2 rounded w-1/4" value={item.hargaPerKg} onChange={e => updateItem(idx, 'hargaPerKg', parseFloat(e.target.value))} required />
              <button type="button" onClick={() => removeItem(idx)} className="bg-red-500 text-white px-2 rounded">Hapus</button>
            </div>
          ))}
          <button type="button" onClick={addItem} className="bg-green-500 text-white px-3 py-1 rounded">+ Tambah Item</button>
        </div>
        <div>
          <label className="block font-medium">Foto Timbangan</label>
          <input type="file" accept="image/*" onChange={e => setFoto(e.target.files?.[0] || null)} />
        </div>
        <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">Simpan Draft</button>
      </form>
    </div>
  )
}