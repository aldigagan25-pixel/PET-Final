"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"

export default function ChartPerforma({ data }: { data: any[] }) {
  // data format expected: [{ date: '2026-05-19', kediri: 1500, madiun: 1200, malang: 900 }, ...]

  return (
    <div className="w-full h-full min-h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorKediri" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorMadiun" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorMalang" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000).toLocaleString('id-ID')} ton`}
          />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
            formatter={(value) => {
              const val = Number(value) / 1000
              const decimalPlaces = val % 1 === 0 ? 0 : (val % 0.1 === 0 ? 1 : 2)
              return [`${val.toLocaleString('id-ID', { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces })} ton`]
            }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }}/>
          <Area type="monotone" dataKey="kediri" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorKediri)" name="Gudang Kediri" />
          <Area type="monotone" dataKey="madiun" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorMadiun)" name="Gudang Madiun" />
          <Area type="monotone" dataKey="malang" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMalang)" name="Gudang Malang" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
