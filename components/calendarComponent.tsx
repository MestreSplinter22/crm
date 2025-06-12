// components/CalendarComponent.tsx
"use client"

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Bell, Settings, CalendarIcon as CalendarIconLucide, X, Edit, Trash2, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar"; // Renomeado para evitar conflito
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  format, addDays, startOfDay, endOfDay, isWithinInterval, isSameDay,
  differenceInDays, eachDayOfInterval, compareAsc
} from "date-fns";
import type { DateRange } from "react-day-picker";
import { useMediaQuery } from "@/hooks/use-media-query";

interface EventItem {
  id: number | string;
  title: string;
  time: string; // Formatado HH:mm
  endTime: string; // Formatado HH:mm
  duration: string; // Ex: "1h", "30m"
  description?: string;
  participants?: Array<{ name: string; avatar?: string; email: string }>;
  category?: string;
  color?: string; // Ex: "border-l-blue-500"
  date: Date; // Objeto Date
  timeSlot: number; // Hora de início (ex: 9 para 9:00 AM)
  // Campos adicionais que podem vir da API
  start_datetime?: string; // ISO string
  end_datetime?: string;   // ISO string
}

// Adaptação da resposta da API para EventItem
function mapApiEventToEventItem(apiEvent: any): EventItem {
    const startDate = new Date(apiEvent.start_datetime);
    const endDate = new Date(apiEvent.end_datetime);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);
    let durationFormatted = "";
    if (durationMinutes >= 60) {
        durationFormatted += `${Math.floor(durationMinutes / 60)}h`;
    }
    if (durationMinutes % 60 > 0) {
        durationFormatted += `${durationMinutes % 60}m`;
    }
    if (!durationFormatted) durationFormatted = "0m";


    return {
        id: apiEvent.id,
        title: apiEvent.title,
        time: format(startDate, "HH:mm"),
        endTime: format(endDate, "HH:mm"),
        duration: durationFormatted,
        description: apiEvent.description,
        participants: apiEvent.participants || [], // Assumindo que a API pode enviar participantes
        category: apiEvent.category,
        color: apiEvent.color_hex ? `border-l-[${apiEvent.color_hex}]` : 'border-l-gray-500',
        date: startDate,
        timeSlot: startDate.getHours(),
        start_datetime: apiEvent.start_datetime,
        end_datetime: apiEvent.end_datetime,
    };
}


const timeSlots = Array.from({ length: 12 }, (_, i) => ({ hour: i + 7, label: format(new Date(0,0,0, i+7,0), "h:mm a")  })); // 7 AM to 6 PM

export default function CalendarComponent() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [errorEvents, setErrorEvents] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: undefined,
  });
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isSingleDate = !dateRange?.to || isSameDay(dateRange.from!, dateRange.to!);

  const fetchEvents = useCallback(async (range: DateRange | undefined) => {
    if (!range?.from) return;
    setIsLoadingEvents(true);
    setErrorEvents(null);
    try {
      const startDate = format(range.from, 'yyyy-MM-dd');
      const endDate = format(range.to || range.from, 'yyyy-MM-dd'); // Se for single, usa a mesma data
      // Esta API /api/calendar-events precisa ser implementada para buscar da tabela 'calendar_events'
      const response = await fetch(`/api/calendar-events?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Falha ao buscar eventos do calendário');
      }
      const apiData = await response.json(); // Espera-se um array de eventos da API
      setEvents(apiData.map(mapApiEventToEventItem));
    } catch (err) {
      setErrorEvents(err instanceof Error ? err.message : "Erro desconhecido.");
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(dateRange);
  }, [dateRange, fetchEvents]);

  const getDisplayDates = () => {
    if (!dateRange?.from) return [];
    if (isSingleDate) return [dateRange.from];
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to! });
    return days.slice(0, 7);
  };
  const displayDates = getDisplayDates();

  const getFilteredEvents = useCallback(() => {
    // O fetch já filtra pelo range, aqui apenas garantimos que está dentro do display atual se necessário
    // ou se houver mais filtros client-side (não há no momento)
    return events;
  }, [events]);

  const filteredEvents = getFilteredEvents();

  const getEventsByDate = () => {
    const eventsByDate: Record<string, EventItem[]> = {};
    filteredEvents.forEach((event) => {
      const dateKey = format(event.date, "yyyy-MM-dd");
      if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
      eventsByDate[dateKey].push(event);
    });
    Object.keys(eventsByDate).forEach((dateKey) => {
      eventsByDate[dateKey].sort((a, b) => a.timeSlot - b.timeSlot);
    });
    return eventsByDate;
  };

  const handleEventClick = (event: EventItem) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleEventAction = (action: "edit" | "cancel" | "complete") => {
    // TODO: Implementar chamadas de API para editar/cancelar/completar eventos
    console.log(`${action} event:`, selectedEvent?.title);
    setIsModalOpen(false);
    setSelectedEvent(null);
    fetchEvents(dateRange); // Re-fetch para atualizar a lista
  };

  const getEventsForDayAndTime = (day: Date, timeSlotHour: number) => {
    return filteredEvents.filter((event) => isSameDay(event.date, day) && event.timeSlot === timeSlotHour);
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    if (range?.from) {
        setDateRange({from: startOfDay(range.from), to: range.to ? startOfDay(range.to) : undefined});
    } else {
        setDateRange(undefined);
    }
    // Não fechar o popover de calendário imediatamente para permitir seleção de range.
  };
  
  const handleCalendarClose = () => setIsCalendarOpen(false);

  const navigateDate = (direction: "prev" | "next") => {
    if (!dateRange?.from) return;
    let newFromDate: Date;
    let newToDate: Date | undefined;

    if (isSingleDate) {
      newFromDate = addDays(dateRange.from, direction === "next" ? 1 : -1);
      newToDate = undefined;
    } else {
      const daysDiff = differenceInDays(dateRange.to!, dateRange.from!);
      const amountToAdd = direction === "next" ? daysDiff + 1 : -(daysDiff + 1);
      newFromDate = addDays(dateRange.from, amountToAdd);
      newToDate = addDays(newFromDate, daysDiff);
    }
    setDateRange({ from: newFromDate, to: newToDate });
  };

  const getDateRangeText = () => {
    if (!dateRange?.from) return "Select Date";
    if (isSingleDate) return format(dateRange.from, "MMM dd, yyyy");
    return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to!, "MMM dd, yyyy")}`;
  };

  const getHeaderTitle = () => {
    if (!dateRange?.from) return "Calendar";
    if (isSingleDate) return format(dateRange.from, "MMMM yyyy");
    const startMonth = format(dateRange.from, "MMMM");
    const endMonth = format(dateRange.to!, "MMMM");
    const startYear = format(dateRange.from, "yyyy");
    const endYear = format(dateRange.to!, "yyyy");
    if (startMonth === endMonth && startYear === endYear) return `${startMonth} ${startYear}`;
    if (startYear === endYear) return `${startMonth} - ${endMonth} ${startYear}`;
    return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
  };

  const renderMobileView = () => { /* ... (usar filteredEvents e isLoadingEvents) */ return <p>Renderização mobile...</p>; };
  const renderDesktopView = () => { /* ... (usar filteredEvents e isLoadingEvents) */ return <p>Renderização desktop...</p>; };

  // JSX Principal do componente (cabeçalho, navegação de data, grid)
  // Mantido como na versão original, mas adaptado para usar `filteredEvents` e `isLoadingEvents`

  if (isLoadingEvents) {
    return <div className="p-6 text-center">Carregando eventos...</div>;
  }
  if (errorEvents) {
    return <div className="p-6 text-center text-destructive">Erro ao carregar eventos: {errorEvents}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <nav className="hidden md:flex items-center gap-8">
            {/* Exemplo de links de navegação */}
          </nav>
          <h1 className="text-xl font-semibold text-foreground md:hidden">Calendário</h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden md:flex"><Bell className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm"><Settings className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 py-4 md:py-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-4">
            <h1 className="text-xl md:text-3xl font-semibold text-foreground">{getHeaderTitle()}</h1>
            {!isSingleDate && dateRange?.from && dateRange?.to && (
              <Badge variant="secondary" className="text-xs md:text-sm">
                {differenceInDays(dateRange.to, dateRange.from) + 1} dias
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIconLucide className="w-4 h-4 mr-2" />
                  <span className="hidden md:inline">{getDateRangeText()}</span>
                  <span className="md:hidden">Data</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 border-b">
                  <p className="text-sm text-muted-foreground mb-2">Selecione uma data ou arraste para um período.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setDateRange({ from: startOfDay(new Date()), to: undefined }); setIsCalendarOpen(false); }}>Hoje</Button>
                    <Button variant="outline" size="sm" onClick={() => { const today = startOfDay(new Date()); setDateRange({ from: today, to: addDays(today, 6) }); setIsCalendarOpen(false); }}>Esta Semana</Button>
                    <Button variant="outline" size="sm" onClick={handleCalendarClose}>OK</Button>
                  </div>
                </div>
                <ShadcnCalendar mode="range" selected={dateRange} onSelect={handleDateSelect} initialFocus />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="sm" onClick={() => navigateDate("prev")}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => navigateDate("next")}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Headers dos dias (Desktop) */}
        {displayDates.length > 0 && !isMobile && (
          <div className="hidden md:grid gap-px mb-px bg-border" style={{ gridTemplateColumns: `80px repeat(${displayDates.length}, 1fr)` }}>
            <div className="w-20 bg-card"></div> {/* Espaçador da coluna de tempo */}
            {displayDates.map((day) => (
              <div key={day.toISOString()} className="text-center py-2 bg-card">
                <div className="text-xs text-muted-foreground mb-0.5">{format(day, "EEE").toUpperCase()}</div>
                <div className={`text-xl font-semibold ${isSameDay(day, new Date()) ? "text-primary" : "text-foreground"}`}>
                  {format(day, "dd")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 md:px-6 pb-6">
        {/* TODO: Implementar renderMobileView e renderDesktopView com base em 'filteredEvents' e 'isLoadingEvents' */}
        {/* Por ora, um placeholder: */}
        {isMobile ? renderMobileView() : renderDesktopView()}
        {(isLoadingEvents) && <p className="text-center py-8">Carregando eventos...</p>}
        {(!isLoadingEvents && errorEvents) && <p className="text-center py-8 text-destructive">Erro: {errorEvents}</p>}
        {(!isLoadingEvents && !errorEvents && filteredEvents.length === 0) && <p className="text-center py-8 text-muted-foreground">Nenhum evento para o período selecionado.</p>}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedEvent?.title}</span>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}><X className="w-4 h-4" /></Button>
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div><h4 className="font-medium text-sm text-foreground mb-1">Horário</h4><p className="text-sm text-muted-foreground">{selectedEvent.time} - {selectedEvent.endTime} ({selectedEvent.duration})</p></div>
              <div><h4 className="font-medium text-sm text-foreground mb-1">Data</h4><p className="text-sm text-muted-foreground">{format(selectedEvent.date, "EEEE, MMMM dd, yyyy")}</p></div>
              {selectedEvent.description && <div><h4 className="font-medium text-sm text-foreground mb-1">Descrição</h4><p className="text-sm text-muted-foreground">{selectedEvent.description}</p></div>}
              {selectedEvent.participants && selectedEvent.participants.length > 0 && <div><h4 className="font-medium text-sm text-foreground mb-2">Participantes</h4><div className="space-y-2">{selectedEvent.participants.map((p, i) => (<div key={i} className="flex items-center gap-3"><p className="text-sm font-medium text-foreground">{p.name}</p></div>))}</div></div>}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => handleEventAction("cancel")} className="flex-1"><Trash2 className="w-4 h-4 mr-2" />Cancelar Evento</Button>
            <Button variant="outline" onClick={() => handleEventAction("edit")} className="flex-1"><Edit className="w-4 h-4 mr-2" />Editar</Button>
            <Button onClick={() => handleEventAction("complete")} className="flex-1"><Check className="w-4 h-4 mr-2" />Completar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}