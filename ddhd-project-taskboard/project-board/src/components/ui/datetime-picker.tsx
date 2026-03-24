"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { CalendarIcon, Clock } from "lucide-react"

interface DateTimePickerProps {
  value?: string
  onChange: (value: string) => void
  className?: string
}

export function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )
  const [selectedTime, setSelectedTime] = React.useState(() => {
    if (value) {
      const d = new Date(value)
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    }
    return "09:00"
  })

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const [hours, minutes] = selectedTime.split(":").map(Number)
      date.setHours(hours, minutes)
      onChange(date.toISOString())
    }
  }

  const handleTimeChange = (time: string) => {
    setSelectedTime(time)
    if (selectedDate) {
      const [hours, minutes] = time.split(":").map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes)
      onChange(newDate.toISOString())
    }
  }

  React.useEffect(() => {
    if (value) {
      const d = new Date(value)
      setSelectedDate(d)
      setSelectedTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`)
    }
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9 px-3",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "yyyy年M月d日", { locale: zhCN }) + ` ${selectedTime}`
          ) : (
            "选择日期和时间"
          )}
        </Button>
      } />
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col gap-2 p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            locale={zhCN}
            initialFocus
          />
          <div className="flex items-center gap-2 border-t pt-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
            <Button
              size="sm"
              onClick={() => setOpen(false)}
            >
              确定
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
