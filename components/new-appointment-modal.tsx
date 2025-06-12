"use client"

import { useState, useEffect, useRef } from "react";
import { ActionModal } from "@/components/ui/action-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Command, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { User, UserPlus, Save, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NewPatientModal } from "./new-patient-modal";
import type { PatientListItem, CreatePatientPayload } from "@/app/page";
import { PopoverAnchor } from "@radix-ui/react-popover";

interface NewAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (appointmentData: any) => Promise<void>;
    initialDate?: Date;
}

// Tipos de exemplo para os dados do agendamento
interface AppointmentPayload {
    patientId: string;
    date: Date;
    time: string;
    appointmentType: string;
    duration: number;
    notes: string;
}


export function NewAppointmentModal({ isOpen, onClose, onSave, initialDate }: NewAppointmentModalProps) {
    const { toast } = useToast();
    
    // --- Estados Globais do Modal ---
    const [isSaving, setIsSaving] = useState(false);
    const [showNewPatientModal, setShowNewPatientModal] = useState(false);
    
    // --- Estados do Formulário de Agendamento ---
    const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(initialDate);
    const [appointmentTime, setAppointmentTime] = useState<string>("");
    const [appointmentType, setAppointmentType] = useState("");
    const [duration, setDuration] = useState<number>(60);
    const [notes, setNotes] = useState("");

    // --- Estados do Componente de Busca de Paciente (Reconstruído) ---
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<PatientListItem[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    
    // Efeito para buscar pacientes na API (com debounce)
    useEffect(() => {
        // Se a busca for vazia ou for exatamente o nome de um paciente já selecionado, não faz nada.
        if (!searchQuery || searchQuery === selectedPatient?.name) {
            setSearchResults([]);
            setIsPopoverOpen(false);
            return;
        }

        // Começa a busca apenas após 2 caracteres
        if (searchQuery.length < 2) {
             setSearchResults([]);
             setIsPopoverOpen(false);
             return;
        }

        setIsSearching(true);
        setIsPopoverOpen(true);

        const handler = setTimeout(async () => {
            try {
                const response = await fetch(`/api/patients?search=${encodeURIComponent(searchQuery)}`);
                if (response.ok) {
                    const data = await response.json();
                    setSearchResults(data.patients || []);
                } else {
                    setSearchResults([]);
                }
            } catch (error) {
                console.error("Falha ao buscar pacientes:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms de atraso

        return () => clearTimeout(handler);
    }, [searchQuery, selectedPatient]);

    // Efeito para resetar o formulário quando o modal principal é aberto
    useEffect(() => {
        if (isOpen) {
            setAppointmentDate(initialDate || new Date());
            setAppointmentTime("");
            setAppointmentType("");
            setDuration(60);
            setNotes("");
            setSelectedPatient(null);
            setSearchQuery("");
            setSearchResults([]);
            setIsPopoverOpen(false);
        }
    }, [isOpen, initialDate]);


    // --- Funções de Manipulação de Eventos ---

    const handlePatientSelect = (patient: PatientListItem) => {
        setSelectedPatient(patient);
        setSearchQuery(patient.name); // Preenche o input com o nome
        setIsPopoverOpen(false); // Fecha o popover
        setSearchResults([]); // Limpa os resultados da busca
    };

    const clearPatientSelection = () => {
        setSelectedPatient(null);
        setSearchQuery("");
        setSearchResults([]);
        setIsPopoverOpen(false);
    };

    const handleAddNewPatient = async (patientData: CreatePatientPayload) => {
        // Lógica de exemplo para criar e selecionar um novo paciente
        try {
            const response = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patientData),
            });
            if (!response.ok) throw new Error('Falha ao criar o paciente.');
            
            const newPatient: PatientListItem = await response.json();
            toast({ title: "Sucesso!", description: `Paciente "${newPatient.name}" criado.` });
            
            setShowNewPatientModal(false);
            handlePatientSelect(newPatient); // Reutiliza a função para selecionar o novo paciente

        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível criar o paciente.", variant: "destructive" });
        }
    };
    
    const handleSaveAppointment = async () => {
        if (!selectedPatient || !appointmentDate || !appointmentTime) {
            toast({ title: "Campos obrigatórios", description: "Selecione um paciente, data e hora.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const appointmentData: AppointmentPayload = {
                patientId: selectedPatient.id,
                date: appointmentDate,
                time: appointmentTime,
                appointmentType,
                duration,
                notes,
            };
            await onSave(appointmentData);
            toast({ title: "Agendamento Salvo!", description: "O agendamento foi registrado com sucesso." });
            onClose();
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível salvar o agendamento.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    // --- Renderização do Componente ---

    return (
      <>
        <ActionModal
            isOpen={isOpen}
            onClose={onClose}
            title="Novo Agendamento"
            size="lg"
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button onClick={handleSaveAppointment} disabled={isSaving || !selectedPatient}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Salvando..." : "Salvar Agendamento"}
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                {/* --- Componente de Busca (Reconstruído) --- */}
                <div className="space-y-2">
                    <Label htmlFor="patient-search-input">Paciente *</Label>
                    <div className="flex gap-2">
                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                            <div className="w-full">
                                <PopoverAnchor asChild>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="patient-search-input"
                                            placeholder="Digite para buscar..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                if (selectedPatient) setSelectedPatient(null); // Desseleciona se o texto mudar
                                            }}
                                            onFocus={() => {
                                                if(searchQuery.length > 1) setIsPopoverOpen(true);
                                            }}
                                            className="pl-10"
                                            autoComplete="off"
                                        />
                                        {selectedPatient && (
                                            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={clearPatientSelection}>
                                                <X className="w-4 h-4 text-muted-foreground"/>
                                            </Button>
                                        )}
                                    </div>
                                </PopoverAnchor>

                                <PopoverContent
                                    className="w-[--radix-popover-trigger-width] p-0"
                                    onOpenAutoFocus={(e) => e.preventDefault()} // **ESSENCIAL: Impede o roubo de foco**
                                >
                                    <Command>
                                        <CommandList>
                                            {isSearching && <div className="p-4 text-sm text-center">Buscando...</div>}
                                            {!isSearching && searchResults.length === 0 && <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>}
                                            <CommandGroup>
                                                {searchResults.map((patient) => (
                                                    <CommandItem
                                                        key={patient.id}
                                                        onSelect={() => handlePatientSelect(patient)}
                                                        className="cursor-pointer"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span>{patient.name}</span>
                                                            <span className="text-xs text-muted-foreground">{patient.phone}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </div>
                        </Popover>
                        
                        <Button variant="secondary" onClick={() => setShowNewPatientModal(true)}>
                            <UserPlus className="w-4 h-4 mr-2"/>
                            Novo
                        </Button>
                    </div>
                </div>

                {/* --- Restante do Formulário --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="app-date">Data *</Label><DatePicker date={appointmentDate} onDateChange={setAppointmentDate} /></div>
                    <div className="space-y-2"><Label htmlFor="app-time">Hora *</Label><TimePicker time={appointmentTime} onTimeChange={setAppointmentTime} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="app-type">Tipo/Motivo</Label><Input id="app-type" value={appointmentType} onChange={e => setAppointmentType(e.target.value)} placeholder="Ex: Consulta Inicial, Retorno" /></div>
                    <div className="space-y-2"><Label htmlFor="app-duration">Duração (min)</Label><Input id="app-duration" type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} placeholder="Ex: 60" /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="app-notes">Observações</Label><Textarea id="app-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Adicione observações importantes..."/></div>
            </div>
        </ActionModal>
        
        <NewPatientModal
            isOpen={showNewPatientModal}
            onClose={() => setShowNewPatientModal(false)}
            onSave={handleAddNewPatient}
        />
      </>
    );
}