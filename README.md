# Pet Com Você

Sistema integrado de gestão para pet shops e clínicas veterinárias. Centraliza agendamento, prontuário clínico, estoque, PDV, financeiro e notificações automáticas via WhatsApp em uma única plataforma.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Backend | NestJS (Node.js + TypeScript) |
| Frontend Web | React.js |
| App Móvel | React Native |
| Banco de Dados | PostgreSQL via Supabase |
| Notificações | WhatsApp Business API |
| Comunicação assíncrona interna | EventEmitter2 (NestJS) |

**Arquitetura:** Monólito Modular — um único processo deployável com cinco módulos de contexto delimitado.

---

## Usuários do Sistema

| Ator | Papel |
|---|---|
| Administrador / Recepcionista | Entrada operacional: agenda, cadastros, PDV, financeiro |
| Veterinário | Registra prontuários, prescrições, vacinas e insumos |
| Tutor | Aprova orçamentos, acompanha saúde do pet via app |
| Sistema | Jobs agendados: notificações preditivas, alertas de estoque |

---

## Base de Conhecimento

| Arquivo | Conteúdo |
|---|---|
| [`docs/domain.md`](./docs/domain.md) | Entidades, atributos, relacionamentos, agregados e regras de negócio |
| [`docs/flows.md`](./docs/flows.md) | Fluxo principal (consulta veterinária) e fluxos secundários |
| [`docs/api.md`](./docs/api.md) | Contratos de API — entrada, processamento e saída de cada operação |
| [`docs/architecture.md`](./docs/architecture.md) | Módulos, fronteiras, padrões de comunicação, decisões técnicas e roadmap |
| [`AGENTS.md`](./AGENTS.md) | Referência rápida de convenções, padrões e restrições para agentes desenvolvedores |
| [`docs/reference/`](./docs/reference/) | PDFs originais do trabalho acadêmico (fonte primária) |

---

## Módulos Internos

| Módulo | Responsabilidade |
|---|---|
| `IdentidadeAcesso` | Autenticação, cadastro de tutores e funcionários, roles/permissões |
| `Clinico` | Prontuários, vacinas, insumos clínicos |
| `AgendamentoServicos` | Agenda, fila de espera, banho, tosa, hotelzinho |
| `EstoquePDV` | Catálogo de produtos, estoque, vendas no PDV, baixa automática |
| `FinanceiroNotificacoes` | Pagamentos, orçamentos, fluxo de caixa, WhatsApp preditivo |

---

## Contexto do Problema

Pet shops e clínicas veterinárias de pequeno e médio porte operam com sistemas isolados ou papel. Isso causa:
- Perda de histórico médico entre atendimentos
- Falhas de comunicação entre equipes (recepção ↔ veterinário ↔ grooming)
- Ausência de visão 360° da jornada do animal
- Recompra não rastreada (tutores esquecem de repor ração e vacinas)

**Solução:** centralizar toda a jornada do animal em um único sistema — do cadastro ao pagamento, do prontuário ao lembrete automatizado.
