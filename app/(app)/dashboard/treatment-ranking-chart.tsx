'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface TreatmentRankingChartProps {
  data: Array<{
    treatmentName: string
    count: number
    totalValue: number
  }>
}

export function TreatmentRankingChart({ data }: TreatmentRankingChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value)
  }

  const colors = [
    '#8b5cf6', // Violeta
    '#06b6d4', // Cyan
    '#10b981', // Esmeralda
    '#f59e0b', // Ámbar
    '#ec4899', // Rosa
  ]

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Top Tratamientos</CardTitle>
        <CardDescription>
          Ranking por volumen y valor generado
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  type="category"
                  dataKey="treatmentName"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  width={120}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => [value, 'Cantidad']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="space-y-2">
              {data.map((item, index) => (
                <div 
                  key={item.treatmentName}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="font-medium">{item.treatmentName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{item.count}</span>
                    <span className="text-muted-foreground ml-2">
                      {formatCurrency(item.totalValue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No hay datos de tratamientos para el período seleccionado
          </div>
        )}
      </CardContent>
    </Card>
  )
}
