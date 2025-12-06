"use client"
 
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
 
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DateRange } from "react-day-picker"
 
export function DatePicker({ date, setDate }: { date: DateRange | undefined, setDate: (date: DateRange | undefined) => void}) {
  const [open, setOpen] = React.useState(false)
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {(date?.from && date?.to) ? (format(date.from, "LLL d") + ' - ' + format(date.to, "LLL d yyyy")) : date?.from ? (format(date.from, "LLL d")) : <span>Pick a date</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] justify-center">
        <Calendar
          mode="range"
          selected={date}
          onSelect={(newDate) => {
            setDate(newDate)
            if (newDate?.from && newDate?.to) {
              setTimeout(() => setOpen(false), 100)
            }
          }}
          initialFocus
        />
      </DialogContent>
    </Dialog>
  )
}