'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface PurchaseItem {
  id: string;
  skuName: string;
  beratSementara: number;
  hargaPerKg: number;
}

interface ReturItem {
  skuName: string;
  beratRetur: number;
  potonganNilai: number;
  alasan: string;
}

export default function DoubleCheckPage() {
  const { id } = useParams();
  const router = useRouter();
  const [purchase, setPurchase] = useState<any>(null);
  const [beratLapak, setBeratLapak] = useState<number>(0);
  const [beratGudang, setBeratGudang] = useState<number>(0);
  const [metodeTerpilih, setMetodeTerpilih] = useState<string>('');
  const [returList, setReturList] = useState<ReturItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/purchases/${id}`)
      .then(res => res.json())
      .then(data => {
        setPurchase(data);
        setMetodeTerpilih(data.metodePembayaran); // default dari staff
      });
  }, [id]);

  const addRetur = () => {
    setReturList([
      ...returList,
      { skuName: '', beratRetur: 0, potonganNilai: 0, alasan: '' }
    ]);
  };

  const updateRetur = (index: number, field: string, value: any) => {
    const updated = [...returList];
    updated[index] = { ...updated[index], [field]: value };
    setReturList(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      beratTimbanganLapak: beratLapak,
      beratTimbanganGudang: beratGudang,
      metodePembayaranTerpilih: metodeTerpilih,
      retur: returList.filter(r => r.skuName && (r.beratRetur > 0 || r.potonganNilai > 0))
    };
    const res = await fetch(`/api/admin/purchases/${id}/double-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      router.push('/admin/dashboard');
    } else {
      alert('Gagal menyimpan double check');
    }
    setLoading(false);
  };

  if (!purchase) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Double Check Transaksi</h1>
      <p>Nota: {purchase.nomorNota} | Supplier: {purchase.supplier.nama}</p>

      <div className="grid grid-cols-2 gap-4 my-4">
        <div>
          <label className="block font-medium">Berat Timbangan Lapak (kg)</label>
          <input type="number" value={beratLapak} onChange={(e) => setBeratLapak(Number(e.target.value))}
                 className="border p-2 w-full rounded" />
        </div>
        <div>
          <label className="block font-medium">Berat Timbangan Gudang (kg)</label>
          <input type="number" value={beratGudang} onChange={(e) => setBeratGudang(Number(e.target.value))}
                 className="border p-2 w-full rounded" />
        </div>
      </div>

      <div className="mb-4">
        <label className="block font-medium">Metode Pembayaran</label>
        <select value={metodeTerpilih} onChange={(e) => setMetodeTerpilih(e.target.value)} className="border p-2 w-full rounded">
          <option value="Timbangan Gudang">Timbangan Gudang</option>
          <option value="Timbangan Lapak">Timbangan Lapak</option>
        </select>
        <p className="text-xs text-gray-500">Staff memilih: {purchase.metodePembayaran}</p>
      </div>

      <div className="mb-4">
        <h3 className="font-bold">Item Pembelian (sementara)</h3>
        <table className="w-full border">
          <thead><tr><th>SKU</th><th>Berat (kg)</th><th>Harga/kg</th></tr></thead>
          <tbody>
            {purchase.items.map((item: PurchaseItem) => (
              <tr key={item.id}>
                <td>{item.skuName}</td>
                <td>{item.beratSementara}</td>
                <td>{item.hargaPerKg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-4">
        <h3 className="font-bold">Retur Barang</h3>
        {returList.map((ret, idx) => (
          <div key={idx} className="border p-2 my-2 grid grid-cols-4 gap-2">
            <input placeholder="SKU" value={ret.skuName} onChange={(e) => updateRetur(idx, 'skuName', e.target.value)} className="border p-1" />
            <input type="number" placeholder="Berat retur (kg)" value={ret.beratRetur} onChange={(e) => updateRetur(idx, 'beratRetur', Number(e.target.value))} className="border p-1" />
            <input type="number" placeholder="Potongan nilai (Rp)" value={ret.potonganNilai} onChange={(e) => updateRetur(idx, 'potonganNilai', Number(e.target.value))} className="border p-1" />
            <input placeholder="Alasan" value={ret.alasan} onChange={(e) => updateRetur(idx, 'alasan', e.target.value)} className="border p-1" />
          </div>
        ))}
        <button onClick={addRetur} className="bg-gray-200 px-3 py-1 rounded">+ Tambah Retur</button>
      </div>

      <button onClick={handleSubmit} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
        {loading ? 'Menyimpan...' : 'Simpan Double Check'}
      </button>
    </div>
  );
}