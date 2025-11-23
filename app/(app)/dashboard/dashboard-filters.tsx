'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface DashboardFiltersProps {
  staffMembers: Array<{
    id: string
    firstName: string
    lastName: string
  }>
  currentPeriod: string
  currentStaffMemberId?: string
  currentStartDate: Date
  currentEndDate: Date
}

export function DashboardFilters({
  staffMembers,
  currentPeriod,
  currentStaffMemberId,
  currentStartDate,
  currentEndDate,
}: DashboardFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [startDate, setStartDate] = useState<Date | undefined>(currentStartDate)
  const [endDate, setEndDate] = useState<Date | undefined>(currentEndDate)

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams)
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    router.push(`/dashboard?${params.toString()}`)
  }

  const handlePeriodChange = (period: string) => {
    updateFilters({ period, startDate: undefined, endDate: undefined })
  }

  const handleStaffMemberChange = (value: string) => {
    updateFilters({ staffMemberId: value === 'all' ? undefined : value })
  }

  const handleCustomDateRange = () => {
    if (startDate && endDate) {
      updateFilters({
        period: 'custom',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
    }
  }

  return (
    <div className="flex flex-wrap gap-4">
      {/* Período predefinido */}
      <Select value={currentPeriod} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleccionar período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoy</SelectItem>
          <SelectItem value="week">Esta semana</SelectItem>
          <SelectItem value="month">Este mes</SelectItem>
          <SelectItem value="quarter">Este trimestre</SelectItem>
          <SelectItem value="year">Este año</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {/* Profesional */}
      <Select 
        value={currentStaffMemberId || 'all'} 
        onValueChange={handleStaffMemberChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Todos los profesionales" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los profesionales</SelectItem>
          {staffMembers.map((staff) => (
            <SelectItem key={staff.id} value={staff.id}>
              {staff.firstName} {staff.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Rango de fechas personalizado */}
      {currentPeriod === 'custom' && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[200px] justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? (
                  format(startDate, 'PPP', { locale: es })
                ) : (
                  <span>Fecha inicio</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[200px] justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? (
                  format(endDate, 'PPP', { locale: es })
                ) : (
                  <span>Fecha fin</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>

          <Button onClick={handleCustomDateRange} disabled={!startDate || !endDate}>
            Aplicar
          </Button>
        </>
      )}
    </div>
  )
}
