# CRM Odontológico - Dra. Maylis Guitton

Plataforma integrada de CRM e análise de funil para consultório odontológico com dashboard em tempo real, gerenciamento de pacientes e processamento de webhooks.

## 🚀 Funcionalidades Principais

### 📊 Dashboard de Análise de Funil
- **Métricas em tempo real** do funil de conversão
- **Visualização gráfica** das etapas do funil
- **Taxas de conversão** entre etapas
- **Filtros por período** (dia, semana, mês)
- **KPIs principais** destacados

### 👥 Gerenciamento de Pacientes (CRM)
- **Lista completa** de pacientes com busca e filtros
- **Perfis detalhados** com histórico completo
- **Operações CRUD** (Criar, Ler, Atualizar, Excluir)
- **Histórico de agendamentos** e procedimentos
- **Status no funil** de cada paciente

### 🔗 Sistema de Webhooks
- **7 tipos de eventos** suportados:
  - `atendimento_iniciado`
  - `duvida_sanada`
  - `procedimento_oferecido`
  - `agendamento_consulta_realizado`
  - `confirmacao_agendamento`
  - `presenca_agendamento_confirmada`
  - `procedimento_realizado`

## 🛠️ Tecnologias Utilizadas

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes de interface
- **Lucide React** - Ícones
- **date-fns** - Manipulação de datas

## 📡 API Endpoints

### Webhooks
\`\`\`
POST /api/webhook/[event]
\`\`\`
Recebe eventos do funil de conversão.

**Exemplo de payload:**
\`\`\`json
{
  "identifier": "paciente_123",
  "email": "paciente@email.com",
  "phone": "(11) 99999-9999",
  "timestamp": "2024-01-15T14:30:00Z",
  "additionalData": {}
}
\`\`\`

### Pacientes
\`\`\`
GET    /api/patients          # Listar pacientes
POST   /api/patients          # Criar paciente
GET    /api/patients/[id]     # Buscar paciente
PUT    /api/patients/[id]     # Atualizar paciente
DELETE /api/patients/[id]     # Excluir paciente
\`\`\`

### Métricas
\`\`\`
GET /api/metrics?period=today|week|month
\`\`\`

## 🚀 Como Usar

### Instalação
\`\`\`bash
npm install
npm run dev
\`\`\`

### Testando Webhooks
\`\`\`bash
# Exemplo: Atendimento iniciado
curl -X POST http://localhost:3000/api/webhook/atendimento_iniciado \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "paciente_123",
    "email": "teste@email.com",
    "phone": "(11) 99999-9999"
  }'
\`\`\`

## 📈 Fluxo do Funil

1. **Atendimento Iniciado** - Primeiro contato
2. **Dúvida Sanada** - Esclarecimentos prestados
3. **Procedimento Oferecido** - Sugestão de tratamento
4. **Agendamento Realizado** - Consulta marcada
5. **Confirmação** - Paciente confirma presença
6. **Comparecimento** - Paciente comparece
7. **Procedimento Realizado** - Tratamento concluído

## 🔒 Segurança e LGPD

- Validação de dados de entrada
- Logs de auditoria
- Possibilidade de anonimização
- Controle de acesso (a ser implementado)

## 🎯 Próximos Passos

- [ ] Integração com banco de dados real
- [ ] Sistema de autenticação
- [ ] Notificações em tempo real
- [ ] Relatórios avançados
- [ ] Integração com WhatsApp Business
- [ ] Backup automático
- [ ] Dashboard mobile

## 📞 Suporte

Para dúvidas ou suporte, entre em contato com a equipe de desenvolvimento.
