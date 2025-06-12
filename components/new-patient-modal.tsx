"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ActionModal } from "@/components/ui/action-modal"
import { FormSection } from "@/components/ui/form-section"
import { DatePicker } from "@/components/ui/date-picker"
import { User, Mail, Phone, Save } from "lucide-react"
import type { CreatePatientPayload } from "@/app/page"

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patientData: CreatePatientPayload) => Promise<void>;
}

// Funções Utilitárias para Formatação
const formatPhone = (value: string) => {
  if (!value) return ""
  value = value.replace(/\D/g, '').slice(0, 11)
  
  if (value.length > 10) {
    value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3')
  } else if (value.length > 5) {
    value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3')
  } else if (value.length > 2) {
    value = value.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2')
  } else {
    value = value.replace(/^(\d*)/, '($1')
  }
  return value
}

const formatCEP = (value: string) => {
    if (!value) return ""
    return value
      .replace(/\D/g, '')
      .slice(0, 8)
      .replace(/(\d{5})(\d)/, '$1-$2')
}

export function NewPatientModal({ isOpen, onClose, onSave }: NewPatientModalProps) {
  const getInitialState = (): CreatePatientPayload => ({
    name: "", email: "", phone: "", birthDate: null, address: "", city: "",
    zipCode: "", emergencyContact: "", emergencyPhone: "", medicalHistory: "",
    allergies: "", medications: "", insuranceProvider: "", insuranceNumber: "",
    preferredContact: "phone", notes: "",
  });

  const [formData, setFormData] = useState<CreatePatientPayload>(getInitialState());
  const [birthDateObj, setBirthDateObj] = useState<Date | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setFormData(getInitialState());
        setBirthDateObj(undefined);
        setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
    
    if (!formData.email.trim()) newErrors.email = "Email é obrigatório";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Formato de email inválido";

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!phoneDigits) newErrors.phone = "Telefone é obrigatório";
    else if (phoneDigits.length < 10) newErrors.phone = "Telefone deve ter no mínimo 10 dígitos";

    if (formData.emergencyPhone) {
        const emergencyPhoneDigits = formData.emergencyPhone.replace(/\D/g, '');
        if (emergencyPhoneDigits.length < 10) newErrors.emergencyPhone = "Telefone de emergência inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClick = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    const payload: CreatePatientPayload = {
        ...formData,
        birthDate: birthDateObj ? birthDateObj.toISOString().split('T')[0] : null,
        phone: formData.phone.replace(/\D/g, ''),
        emergencyPhone: formData.emergencyPhone?.replace(/\D/g, ''),
        zipCode: formData.zipCode?.replace(/\D/g, ''),
    };
    try {
      await onSave(payload);
    } catch (error) {
      console.error("Falha ao salvar paciente no modal:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    const formatters: Record<string, (val: string) => string> = {
        phone: formatPhone,
        emergencyPhone: formatPhone,
        zipCode: formatCEP,
        email: (val) => val.trim(),
    };

    const formattedValue = formatters[name] ? formatters[name](value) : value;

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (name: keyof CreatePatientPayload, value: string) => {
    setFormData((prev) => ({...prev, [name]: value}));
  }

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cadastrar Novo Paciente"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSaveClick} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Paciente"}
          </Button>
        </>
      }
    >
      {/* ===== LINHA CORRIGIDA ABAIXO ===== */}
      {/* Removido: max-h-[70vh] overflow-y-auto */}
      <div className="space-y-6">
        <FormSection title="Informações Pessoais" description="Dados básicos do paciente">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="Digite o nome completo" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  className={`pl-10 ${errors.name ? "border-destructive" : ""}`} 
                  disabled={isSaving}
                />
              </div>
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <DatePicker 
                date={birthDateObj} 
                onDateChange={setBirthDateObj} 
                placeholder="Selecionar data" 
                className="mt-1 w-full" 
                disabled={isSaving} 
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="email@exemplo.com" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  className={`pl-10 ${errors.email ? "border-destructive" : ""}`} 
                  disabled={isSaving}
                />
              </div>
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Telefone / Celular *</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  id="phone" 
                  name="phone" 
                  placeholder="(XX) XXXXX-XXXX" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  className={`pl-10 ${errors.phone ? "border-destructive" : ""}`} 
                  disabled={isSaving} 
                  maxLength={15}
                />
              </div>
              {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>
        </FormSection>

        <FormSection title="Endereço" description="Informações de localização">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input 
                id="address" 
                name="address" 
                placeholder="Rua, número, complemento" 
                value={formData.address} 
                onChange={handleInputChange} 
                className="mt-1" 
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="zipCode">CEP</Label>
              <Input 
                id="zipCode" 
                name="zipCode" 
                placeholder="00000-000" 
                value={formData.zipCode} 
                onChange={handleInputChange} 
                className="mt-1" 
                disabled={isSaving} 
                maxLength={9} 
              />
            </div>
            <div className="md:col-span-1">
              <Label htmlFor="city">Cidade</Label>
              <Input 
                id="city" 
                name="city" 
                placeholder="Nome da cidade" 
                value={formData.city} 
                onChange={handleInputChange} 
                className="mt-1" 
                disabled={isSaving}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Contato de Emergência">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyContact">Nome do Contato</Label>
              <Input 
                id="emergencyContact" 
                name="emergencyContact" 
                placeholder="Nome completo" 
                value={formData.emergencyContact} 
                onChange={handleInputChange} 
                className="mt-1" 
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
              <Input 
                id="emergencyPhone" 
                name="emergencyPhone" 
                placeholder="(XX) XXXXX-XXXX" 
                value={formData.emergencyPhone} 
                onChange={handleInputChange} 
                className={`mt-1 ${errors.emergencyPhone ? "border-destructive" : ""}`} 
                disabled={isSaving} 
                maxLength={15}
              />
              {errors.emergencyPhone && <p className="text-destructive text-xs mt-1">{errors.emergencyPhone}</p>}
            </div>
          </div>
        </FormSection>
        
        <FormSection title="Informações Médicas">
          <div>
            <Label htmlFor="medicalHistory">Histórico Médico Relevante</Label>
            <Textarea 
              id="medicalHistory" 
              name="medicalHistory" 
              placeholder="Descreva condições pré-existentes, cirurgias, etc." 
              value={formData.medicalHistory} 
              onChange={handleInputChange} 
              className="mt-1" 
              rows={3} 
              disabled={isSaving}
            />
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="allergies">Alergias</Label>
              <Input 
                id="allergies" 
                name="allergies" 
                placeholder="Ex: Penicilina, Látex" 
                value={formData.allergies} 
                onChange={handleInputChange} 
                className="mt-1" 
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="medications">Medicamentos em Uso</Label>
              <Input 
                id="medications" 
                name="medications" 
                placeholder="Ex: Losartana, AAS" 
                value={formData.medications} 
                onChange={handleInputChange} 
                className="mt-1" 
                disabled={isSaving}
              />
            </div>
           </div>
        </FormSection>

        <FormSection title="Convênio">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="insuranceProvider">Operadora do Convênio</Label>
              <Input 
                id="insuranceProvider" 
                name="insuranceProvider" 
                placeholder="Nome da operadora" 
                value={formData.insuranceProvider} 
                onChange={handleInputChange} 
                className="mt-1" 
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="insuranceNumber">Número da Carteirinha</Label>
              <Input 
                id="insuranceNumber" 
                name="insuranceNumber" 
                placeholder="Número do convênio" 
                value={formData.insuranceNumber} 
                onChange={handleInputChange} 
                className="mt-1" 
                disabled={isSaving}
              />
            </div>
           </div>
        </FormSection>

        <FormSection title="Preferências e Observações">
          <div>
            <Label htmlFor="preferredContact">Forma Preferida de Contato</Label>
            <Select 
              value={formData.preferredContact} 
              onValueChange={(value) => handleSelectChange("preferredContact", value)} 
              disabled={isSaving}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Label htmlFor="notes">Observações Gerais</Label>
            <Textarea 
              id="notes" 
              name="notes" 
              placeholder="Adicione observações importantes sobre o paciente..." 
              value={formData.notes} 
              onChange={handleInputChange} 
              className="mt-1" 
              rows={3} 
              disabled={isSaving}
            />
          </div>
        </FormSection>
      </div>
    </ActionModal>
  );
}