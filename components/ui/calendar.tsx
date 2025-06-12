"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, ActiveModifiers, DayPickerSingleProps } from "react-day-picker" // Importe DayPickerSingleProps
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import React from "react"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

// ALTERADO: Remova 'onSelect' da desestruturação aqui
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [currentDisplayDate, setCurrentDisplayDate] = React.useState(props.month || new Date());
  const [view, setView] = React.useState<"days" | "months" | "years">("days");

  React.useEffect(() => {
    if (props.month) {
      setCurrentDisplayDate(props.month);
    }
  }, [props.month]);

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentDisplayDate(new Date(currentDisplayDate.getFullYear(), monthIndex, 1));
    setView("days");
  };

  const handleYearSelect = (year: number) => {
    setCurrentDisplayDate(new Date(year, currentDisplayDate.getMonth(), 1));
    setView("months");
  };
  
  const handleDaySelect = (
    day: Date | undefined,
    selectedDay: Date,
    modifiers: ActiveModifiers,
    e: React.MouseEvent
  ) => {
    if (!day) return;

    const year = currentDisplayDate.getFullYear();
    const month = currentDisplayDate.getMonth();
    const newDate = new Date(year, month, day.getDate());

    // ALTERADO: Verifique se o modo é 'single' para garantir a tipagem correta
    if (props.mode === 'single') {
        // Agora o TypeScript sabe que props.onSelect existe e tem a assinatura correta.
        (props as DayPickerSingleProps).onSelect?.(newDate, newDate, modifiers, e);
    }
  };

  const currentYear = currentDisplayDate.getFullYear();
  // @ts-ignore // Ignorando erro de tipo para props customizadas fromYear/toYear
  const fromYear = props.fromYear || currentYear - 100;
  // @ts-ignore
  const toYear = props.toYear || currentYear + 10;
  const yearList = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i);

  const CustomCaption = (
    <div className="flex justify-center pt-1 relative items-center">
      {/* ...código do CustomCaption sem alterações... */}
      <div className="text-sm font-medium space-x-1">
        <Button variant="ghost" onClick={() => setView("months")} className="capitalize">
          {format(currentDisplayDate, "MMMM", { locale: ptBR })}
        </Button>
        <Button variant="ghost" onClick={() => setView("years")}>
          {currentYear}
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      {view === "days" && (
        <DayPicker
          showOutsideDays={showOutsideDays}
          className={cn("p-3", className)}
          classNames={{
            // ...suas classes...
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption_label: "hidden", 
            caption: "flex justify-center pt-1 relative items-center",
            nav: "space-x-1 flex items-center",
            nav_button: cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
            day_disabled: "text-muted-foreground opacity-50",
            ...classNames,
          }}
          components={{
            Caption: () => CustomCaption,
            IconLeft: () => <ChevronLeft className="h-4 w-4" />,
            IconRight: () => <ChevronRight className="h-4 w-4" />,
          }}
          month={currentDisplayDate}
          onMonthChange={setCurrentDisplayDate}
          onSelect={handleDaySelect}
          {...props}
        />
      )}
      
      {/* ...código para view 'months' e 'years' sem alterações... */}
       {view === "months" && ( <div className="p-3"> {CustomCaption} <div className="grid grid-cols-3 gap-2 mt-4"> {Array.from({ length: 12 }).map((_, i) => ( <Button key={i} variant={currentDisplayDate.getMonth() === i ? "default" : "ghost"} onClick={() => handleMonthSelect(i)} className="w-full capitalize" > {format(new Date(0, i), "MMM", { locale: ptBR })} </Button> ))} </div> </div> )}
       {view === "years" && ( <div className="p-3"> {CustomCaption} <ScrollArea className="h-80 w-full mt-4 pr-3"> <div className="grid grid-cols-3 gap-2"> {yearList.map((year) => ( <Button key={year} variant={currentYear === year ? "default" : "ghost"} onClick={() => handleYearSelect(year)} className="w-full" > {year} </Button> ))} </div> </ScrollArea> </div> )}
    </div>
  );
}

Calendar.displayName = "Calendar"

export { Calendar }