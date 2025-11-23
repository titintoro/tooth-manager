'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface OccupancyChartProps {
  data: Array<{
    chairName: string
    occupancyRate: number
  }>
}

export function OccupancyChart({ data }: OccupancyChartProps) {
  // Colores basados en el porcentaje de ocupación
  const getBarColor = (value: number) => {
    if (value >= 80) return '#22c55e' // Verde - Alta ocupación
    if (value >= 50) return '#eab308' // Amarillo - Media ocupación
    return '#ef4444' // Rojo - Baja ocupación
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Ocupación por Sillón</CardTitle>
        <CardDescription>
          Porcentaje de tiempo ocupado en el período seleccionado
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="chairName" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Ocupación']}
              />
              <Bar dataKey="occupancyRate" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.occupancyRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No hay datos de ocupación para el período seleccionado
          </div>
        )}
      </CardContent>
    </Card>
  )
}
