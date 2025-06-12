"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarDayEventSummary {
  appointments: { count: number; confirmed: number; pending: number };
  procedures: { count: number; completed: number; agendado: number };
}

interface CalendarEventsData {
  [dateKey: string]: CalendarDayEventSummary; // dateKey: "YYYY-MM-DD"
}

interface CalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function CalendarView({ selectedDate, onDateSelect }: CalendarViewProps) {
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [monthEvents, setMonthEvents] = useState<CalendarEventsData>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchMonthEventsSummary = useCallback(async (monthDate: Date) => {
    setIsLoading(true);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth() + 1; // API geralmente espera mês 1-12

    try {
      // Você precisaria de um endpoint na API que retorne um resumo de eventos por dia para um dado mês/ano
      // Ex: GET /api/calendar-summary?year=2024&month=7
      // Por agora, vamos simular uma resposta.
      // const response = await fetch(`/api/calendar-summary?year=${year}&month=${month}`);
      // if (!response.ok) throw new Error('Failed to fetch calendar summary');
      // const data: CalendarEventsData = await response.json();
      // setMonthEvents(data);

      // Simulação:
      const simulatedData: CalendarEventsData = {};
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        if (Math.random() > 0.5) { // Simula alguns dias com eventos
            const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            simulatedData[dateKey] = {
                appointments: { count: Math.floor(Math.random() * 5) + 1, confirmed: Math.floor(Math.random() * 3), pending: Math.floor(Math.random() * 2) },
                procedures: { count: Math.floor(Math.random() * 4), completed: Math.floor(Math.random() * 2), agendado: Math.floor(Math.random() * 2) },
            };
        }
      }
      setMonthEvents(simulatedData);

    } catch (error) {
      console.error("Error fetching calendar summary:", error);
      setMonthEvents({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonthEventsSummary(currentDisplayMonth);
  }, [currentDisplayMonth, fetchMonthEventsSummary]);

  // Atualiza o mês exibido se selectedDate mudar externamente para um mês diferente
  useEffect(() => {
    if (selectedDate.getFullYear() !== currentDisplayMonth.getFullYear() || selectedDate.getMonth() !== currentDisplayMonth.getMonth()) {
        setCurrentDisplayMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate, currentDisplayMonth]);


  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0=Sun, 1=Mon,...

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDisplayMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newMonth;
    });
  };

  const daysInCurrentMonth = getDaysInMonth(currentDisplayMonth);
  const firstDayOfCurrentMonth = getFirstDayOfMonth(currentDisplayMonth);
  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const formatDateKey = (year: number, month: number, day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentDisplayMonth.getMonth() && today.getFullYear() === currentDisplayMonth.getFullYear();
  };

  const isSelectedDay = (day: number) => {
    return selectedDate.getDate() === day && selectedDate.getMonth() === currentDisplayMonth.getMonth() && selectedDate.getFullYear() === currentDisplayMonth.getFullYear();
  };

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")} className="h-9 w-9 hover:bg-accent">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <CardTitle className="text-lg font-semibold text-foreground">
            {monthNames[currentDisplayMonth.getMonth()]} {currentDisplayMonth.getFullYear()}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")} className="h-9 w-9 hover:bg-accent">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading && <div className="text-center py-10">Carregando calendário...</div>}
        {!isLoading && (
            <div className="grid grid-cols-7 gap-1 text-center">
              {dayNames.map((dayName) => (
                <div key={dayName} className="p-2 text-xs font-medium text-muted-foreground">{dayName}</div>
              ))}
              {Array.from({ length: firstDayOfCurrentMonth }, (_, i) => (
                <div key={`empty-start-${i}`} className="p-1 border border-transparent h-20 md:h-24" />
              ))}
              {Array.from({ length: daysInCurrentMonth }, (_, i) => {
                const day = i + 1;
                const dateKey = formatDateKey(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth(), day);
                const dayEventsSummary = monthEvents[dateKey];

                return (
                  <div
                    key={day}
                    className={`p-1.5 md:p-2 border rounded-md cursor-pointer transition-colors h-20 md:h-24 flex flex-col
                      ${isSelectedDay(day) ? "bg-primary border-primary text-primary-foreground" :
                       isToday(day) ? "bg-accent border-border" : "border-border hover:bg-accent/50"}`}
                    onClick={() => onDateSelect(new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth(), day))}
                  >
                    <span className={`text-xs md:text-sm font-medium ${isSelectedDay(day) ? "text-primary-foreground" : isToday(day) ? "text-primary" : "text-foreground"}`}>
                      {day}
                    </span>
                    {dayEventsSummary && (
                      <div className="mt-1 space-y-0.5 text-left overflow-hidden flex-grow">
                        {dayEventsSummary.appointments?.count > 0 && (
                          <Badge variant="default" className={`text-[10px] px-1.5 py-0.5 leading-tight w-full justify-start truncate ${isSelectedDay(day) ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-info-muted text-info-foreground'}`}>
                            {dayEventsSummary.appointments.count} Agend.
                          </Badge>
                        )}
                         {dayEventsSummary.procedures?.count > 0 && (
                          <Badge variant="default" className={`text-[10px] px-1.5 py-0.5 leading-tight w-full justify-start truncate ${isSelectedDay(day) ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-success-muted text-success-foreground'}`}>
                             {dayEventsSummary.procedures.count} Proc.
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
               {/* Empty cells for days after month ends to fill the grid */}
              {Array.from({ length: (7 - (firstDayOfCurrentMonth + daysInCurrentMonth) % 7) % 7 }, (_, i) => (
                <div key={`empty-end-${i}`} className="p-1 border border-transparent h-20 md:h-24" />
              ))}
            </div>
        )}
      </CardContent>
    </Card>
  );
}