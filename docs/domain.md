# Modelo de Domínio — Pet Com Você

O Pet é o sujeito central do domínio. Todos os fluxos giram em torno dele: atendimentos, vacinas, agendamentos e histórico clínico pertencem ao Pet. O Tutor é o cliente do estabelecimento e responsável legal pelo animal.

---

## Entidades

### Tutor

Responsável legal pelo animal. Cliente do estabelecimento. Titular financeiro das operações.

| Atributo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador único |
| nome | string | Nome completo |
| email | string | E-mail para autenticação e contato |
| telefone | string | Telefone principal |
| whatsapp | string | Número para notificações automáticas |
| cpf | string | Documento para emissão fiscal |
| endereco | string | Endereço completo |
| dataCadastro | date | Data de registro |

**Módulo:** `IdentidadeAcesso`
**Tabela:** `tutors`

---

### Pet

Animal de estimação vinculado a um tutor. Sujeito central — ao redor dele giram atendimentos, vacinas, serviços e histórico clínico.

| Atributo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador único |
| tutorId | UUID | FK → Tutor |
| nome | string | Nome do animal |
| especie | enum | `DOG`, `CAT`, `BIRD`, `REPTILE`, `OTHER` |
| raca | string | Raça do animal |
| dataNascimento | date | Data de nascimento |
| peso | decimal | Peso atual em kg (atualizado a cada atendimento) |
| sexo | enum | `MALE`, `FEMALE` |
| castrado | boolean | Indica se o animal é castrado |
| observacoes | text | Alergias, condições especiais, temperamento |
| fotoUrl | string | URL da foto do animal |

**Módulo:** `IdentidadeAcesso`
**Tabela:** `pets`

---

### Funcionario

Colaborador interno do estabelecimento. Pode ser veterinário, tosador, recepcionista ou gerente.

| Atributo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador único |
| nome | string | Nome completo |
| email | string | E-mail para login |
| cargo | enum | `VET`, `GROOMER`, `RECEPTIONIST`, `MANAGER` |
| crmv | string | Registro profissional (obrigatório para `VET`) |
| ativo | boolean | Status de atividade no sistema |
| especialidades | string[] | Lista de especialidades (apenas para `VET`) |

**Módulo:** `IdentidadeAcesso`
**Tabela:** `employees`

---

### Agendamento

Reserva de horário para qualquer tipo de serviço. Raiz do agregado `ServicoAgendado`.

| Atributo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador único |
| petId | UUID | FK → Pet |
| funcionarioId | UUID | FK → Funcionario responsável |
| tipo | enum | `CONSULTATION`, `BATH`, `GROOMING`, `BATH_GROOMING`, `HOTEL`, `RETURN` |
| dataHora | timestamptz | Data e hora do serviço |
| duracao | integer | Duração estimada em minutos |
| status | enum | `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW` |
| observacoes | text | Informações adicionais |
| filaDeEspera | boolean | Indica se está na fila de espera |

**Módulo:** `AgendamentoServicos`
**Tabela:** `appointments`

**Ciclo de status:**
```
SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED
                    ↓
                CANCELLED
                NO_SHOW
```

---

### Prontuario

Registro clínico completo do atendimento. Raiz do agregado `AtendimentoClinico`.

| Atributo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador único |
| petId | UUID | FK → Pet |
| veterinarioId | UUID | FK → Funcionario (cargo `VET`) |
| agendamentoId | UUID | FK → Agendamento de origem |
| data | timestamptz | Data e hora do atendimento |
| anamnese | text | Relato do tutor e queixas |
| exameClinico | text | Observações do exame físico |
| diagnostico | text | Diagnóstico do veterinário |
| prescricao | text | Receituário e orientações |
| retornoRecomendado | date | Data sugerida para retorno |
| insumosUtilizados | InsumoProntuario[] | Insumos clínicos usados (geram baixa automática) |

**Módulo:** `Clinico`
**Tabela:** `medical_records`
**Restrição:** apenas o veterinário vinculado ao agendamento pode editar após criação.
**Evento ao fechar:** publica `medical-record.closed` com lista de insumos utilizados.

---

### InsumoProntuario

Item de insumo clínico registrado dentro de um prontuário. Não existe independentemente do Prontuário.

| Atributo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador único |
| prontuarioId | UUID | FK → Prontuario |
| produtoId | UUID | FK → Produto (tipo `CLINICAL_SUPPLY`) |
| quantidade | integer | Quantidade utilizada |
| observacoes | text | Observações sobre o uso |

**Módulo:** `Clinico`
**Tabela:** `medical_record_supplies`

---

### RegistroVacinal

Aplicação de vacina realizada em um pet. Mantém o cartão vacinal digital.

| Atributo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador único |
| petId | UUID | FK → Pet |
| vacinaId | UUID | FK → Produto (tipo vacina) |
| veterinarioId | UUID | FK → Funcionario (cargo `VET`) |
| dataAplicacao | date | Data da aplicação |
| dataProximaDose | date | Data calculada para o reforço |
| lote | string | Lote do imunobiológico |
| observacoes | text | Reações ou observações pós-aplicação |

**Módulo:** `Clinico`
**Tabela:** `vaccination_records`
**Efeito colateral:** ao criar, agendar notificação de lembrete para 30 dias antes de `dataProximaDose`.

---

### Produto

Item comercializado ou consumido internamente. Cobre tanto varejo (venda ao tutor) quanto insumos clínicos (consumo interno durante atendimento).

| Atributo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador único |
| nome | string | Nome do produto |
| descricao | text | Descrição detalhada |
| categoria | enum | `FOOD`, `MEDICINE`, `ACCESSORY`, `CLINICAL_SUPPLY`, `HYGIENE` |
| preco | integer | Preço de venda em centavos |
| custoUnitario | integer | Custo de aquisição em centavos |
| quantidadeEmEstoque | integer | Quantidade disponível |
| quantidadeMinima | integer | Nível de alerta de reposição |
| dataValidade | date | Validade (perecíveis e medicamentos) |
| sku | string | Código interno do produto |
| usoClinico | boolean | `true` = insumo com baixa automática ao fechar prontuário |

**Módulo:** `EstoquePDV`
**Tabela:** `products`

---

### Venda

Transação comercial de produtos no PDV. Raiz do agregado `TransacaoComercial`.

| Atributo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador único |
| tutorId | UUID | FK → Tutor (nulo para vendas avulsas) |
| funcionarioId | UUID | FK → Funcionario que realizou a venda |
| data | timestamptz | Data e hora da venda |
| status | enum | `OPEN`, `COMPLETED`, `CANCELLED` |
| subtotalCentavos | integer | Valor sem descontos em centavos |
| descontoCentavos | integer | Desconto aplicado em centavos |
| totalCentavos | integer | Valor final em centavos |
| observacoes | text | Informações adicionais |

**Módulo:** `EstoquePDV`
**Tabela:** `sales`

---

### ItemVenda

Produto incluído em uma venda. Não existe independentemente da Venda.

| Atributo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador único |
| vendaId | UUID | FK → Venda |
| produtoId | UUID | FK → Produto |
| quantidade | integer | Quantidade vendida |
| precoUnitarioCentavos | integer | Preço no momento da venda em centavos |
| subtotalCentavos | integer | `quantidade × precoUnitario` em centavos |

**Módulo:** `EstoquePDV`
**Tabela:** `sale_items`

---

### Orcamento

Proposta de serviço enviada ao tutor para aprovação antes da execução. Não existe independentemente do Agendamento.

| Atributo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador único |
| agendamentoId | UUID | FK → Agendamento |
| petId | UUID | FK → Pet |
| tutorId | UUID | FK → Tutor que receberá o orçamento |
| itens | ItemOrcamento[] | Lista de serviços e produtos orçados |
| totalCentavos | integer | Valor total em centavos |
| status | enum | `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED` |
| dataEnvio | timestamptz | Momento do envio ao tutor |
| dataResposta | timestamptz | Momento da resposta do tutor |
| motivoRecusa | text | Preenchido quando status = `REJECTED` |
| observacoes | text | Observações do profissional |

**Módulo:** `FinanceiroNotificacoes`
**Tabela:** `budgets`

---

### Pagamento

Transação financeira vinculada a uma venda ou agendamento concluído.

| Atributo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador único |
| referenciaId | UUID | ID da venda ou agendamento |
| tipoReferencia | enum | `SALE`, `APPOINTMENT` |
| valorCentavos | integer | Valor cobrado em centavos |
| metodo | enum | `CASH`, `DEBIT_CARD`, `CREDIT_CARD`, `PIX`, `BOLETO` |
| status | enum | `PENDING`, `APPROVED`, `REJECTED`, `REFUNDED` |
| dataProcessamento | timestamptz | Momento do processamento |
| codigoTransacao | string | Código externo do gateway (quando aplicável) |

**Módulo:** `FinanceiroNotificacoes`
**Tabela:** `payments`
**Restrição:** status `APPROVED` é imutável. Estorno exige operação `refund` explícita que cria novo registro.

---

### Notificacao

Aviso enviado ao tutor via WhatsApp ou e-mail. Disparado de forma assíncrona, nunca bloqueando o fluxo principal.

| Atributo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador único |
| tutorId | UUID | FK → Tutor destinatário |
| tipo | enum | `VACCINE_REMINDER`, `FOOD_RESTOCK`, `APPOINTMENT_CONFIRMATION`, `BUDGET_PENDING`, `PROMOTION` |
| canal | enum | `WHATSAPP`, `EMAIL` |
| mensagem | text | Conteúdo da mensagem |
| dataEnvio | timestamptz | Momento do envio |
| status | enum | `SENT`, `DELIVERED`, `READ`, `FAILED` |
| linkAcao | string | Link de pagamento ou confirmação (quando aplicável) |

**Módulo:** `FinanceiroNotificacoes`
**Tabela:** `notifications`

---

## Relacionamentos

| Relacionamento | Cardinalidade | Descrição |
|---|---|---|
| Tutor → Pet | 1 : N | Um tutor pode ter vários animais |
| Pet → Agendamento | 1 : N | Um pet pode ter vários agendamentos |
| Pet → Prontuario | 1 : N | Um pet acumula múltiplos registros clínicos |
| Pet → RegistroVacinal | 1 : N | Um pet possui histórico vacinal |
| Funcionario → Agendamento | 1 : N | Um funcionário pode ter vários agendamentos |
| Agendamento → Prontuario | 1 : 1 | Uma consulta gera um prontuário |
| Agendamento → Orcamento | 1 : 1 | Um serviço pode gerar um orçamento |
| Prontuario → InsumoProntuario | 1 : N | Um prontuário registra vários insumos |
| Venda → ItemVenda | 1 : N | Uma venda contém vários itens |
| ItemVenda → Produto | N : 1 | Vários itens referenciam o mesmo produto |
| Venda → Pagamento | 1 : 1 | Uma venda possui um pagamento |
| Agendamento → Pagamento | 1 : 1 | Um serviço concluído gera um pagamento |
| Tutor → Notificacao | 1 : N | Um tutor recebe várias notificações |

---

## Agregados

Agregados definem as unidades transacionais do domínio. Toda operação passa pela raiz — nunca por entidades filhas diretamente.

### Agregado 1: Serviço Agendado

```
Agendamento (raiz)
└── Orcamento
```

O Agendamento controla o ciclo de vida do serviço. O Orçamento só existe enquanto o agendamento estiver ativo.

### Agregado 2: Atendimento Clínico

```
Prontuario (raiz)
├── InsumoProntuario[]
└── (referência externa) agendamentoId
```

Toda interação com o histórico clínico passa pelo Prontuário. O Agendamento é referenciado por ID, não incluso no agregado.

### Agregado 3: Transação Comercial

```
Venda (raiz)
├── ItemVenda[]
└── Pagamento
```

O total da venda, consistência dos itens e estado do pagamento são controlados pela raiz. Nenhum ItemVenda existe fora de uma Venda.

---

## Regras de Negócio (Invariantes do Domínio)

Estas regras são invariantes — nunca podem ser violadas. Implementar na **camada de domínio**, não na controller.

| # | Regra | Módulo responsável |
|---|---|---|
| 1 | Agendamento só criado se profissional estiver livre no horário | `AgendamentoServicos` |
| 2 | Serviço só inicia após orçamento com status `APPROVED` (quando houver orçamento) | `AgendamentoServicos` |
| 3 | Agendamento do tipo `HOTEL` bloqueado se antirrábica ou múltipla (V10) estiverem vencidas ou ausentes | `AgendamentoServicos` |
| 4 | Ao fechar prontuário, publicar evento `medical-record.closed` com insumos para baixa automática de estoque | `Clinico` |
| 5 | Produto não pode ser incluído em venda se `quantidadeEmEstoque = 0` | `EstoquePDV` |
| 6 | Quando estoque atingir `quantidadeMinima`, publicar evento `inventory.minimum-reached` | `EstoquePDV` |
| 7 | Pagamento com status `APPROVED` não pode ser alterado; estorno requer operação `refund` explícita | `FinanceiroNotificacoes` |
| 8 | Prontuário só pode ser editado pelo veterinário vinculado ao agendamento | `Clinico` |
| 9 | Job diário: quando restam ≤ 5 dias para o fim estimado de produto recorrente, enviar WhatsApp com link de pagamento | `FinanceiroNotificacoes` |
| 10 | 30 dias antes de `dataProximaDose` de cada vacina, gerar e enviar lembrete ao tutor | `FinanceiroNotificacoes` |

---

## Schema SQL (Referência Inicial)

```sql
-- Tutores
CREATE TABLE tutors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  whatsapp TEXT,
  cpf TEXT UNIQUE NOT NULL,
  endereco TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pets
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES tutors(id),
  nome TEXT NOT NULL,
  especie TEXT NOT NULL CHECK (especie IN ('DOG','CAT','BIRD','REPTILE','OTHER')),
  raca TEXT,
  data_nascimento DATE,
  peso DECIMAL(5,2),
  sexo TEXT CHECK (sexo IN ('MALE','FEMALE')),
  castrado BOOLEAN DEFAULT false,
  observacoes TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Funcionários
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  cargo TEXT NOT NULL CHECK (cargo IN ('VET','GROOMER','RECEPTIONIST','MANAGER')),
  crmv TEXT,
  ativo BOOLEAN DEFAULT true,
  especialidades TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agendamentos
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('CONSULTATION','BATH','GROOMING','BATH_GROOMING','HOTEL','RETURN')),
  data_hora TIMESTAMPTZ NOT NULL,
  duracao INTEGER,
  status TEXT NOT NULL DEFAULT 'SCHEDULED'
    CHECK (status IN ('SCHEDULED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW')),
  observacoes TEXT,
  fila_de_espera BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Prontuários
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id),
  vet_id UUID NOT NULL REFERENCES employees(id),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  anamnese TEXT,
  exame_clinico TEXT,
  diagnostico TEXT,
  prescricao TEXT,
  retorno_recomendado DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insumos do Prontuário
CREATE TABLE medical_record_supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantidade INTEGER NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Registros Vacinais
CREATE TABLE vaccination_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id),
  vacina_id UUID NOT NULL REFERENCES products(id),
  vet_id UUID NOT NULL REFERENCES employees(id),
  data_aplicacao DATE NOT NULL,
  data_proxima_dose DATE,
  lote TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Produtos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('FOOD','MEDICINE','ACCESSORY','CLINICAL_SUPPLY','HYGIENE')),
  preco_centavos INTEGER NOT NULL DEFAULT 0,
  custo_unitario_centavos INTEGER NOT NULL DEFAULT 0,
  quantidade_em_estoque INTEGER NOT NULL DEFAULT 0,
  quantidade_minima INTEGER NOT NULL DEFAULT 0,
  data_validade DATE,
  sku TEXT UNIQUE,
  uso_clinico BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vendas
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID REFERENCES tutors(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','COMPLETED','CANCELLED')),
  subtotal_centavos INTEGER NOT NULL DEFAULT 0,
  desconto_centavos INTEGER NOT NULL DEFAULT 0,
  total_centavos INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Itens da Venda
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantidade INTEGER NOT NULL,
  preco_unitario_centavos INTEGER NOT NULL,
  subtotal_centavos INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orçamentos
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  pet_id UUID NOT NULL REFERENCES pets(id),
  tutor_id UUID NOT NULL REFERENCES tutors(id),
  total_centavos INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','EXPIRED')),
  data_envio TIMESTAMPTZ,
  data_resposta TIMESTAMPTZ,
  motivo_recusa TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pagamentos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referencia_id UUID NOT NULL,
  tipo_referencia TEXT NOT NULL CHECK (tipo_referencia IN ('SALE','APPOINTMENT')),
  valor_centavos INTEGER NOT NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('CASH','DEBIT_CARD','CREDIT_CARD','PIX','BOLETO')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','REFUNDED')),
  data_processamento TIMESTAMPTZ,
  codigo_transacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES tutors(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('VACCINE_REMINDER','FOOD_RESTOCK','APPOINTMENT_CONFIRMATION','BUDGET_PENDING','PROMOTION')),
  canal TEXT NOT NULL CHECK (canal IN ('WHATSAPP','EMAIL')),
  mensagem TEXT NOT NULL,
  data_envio TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT','DELIVERED','READ','FAILED')),
  link_acao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
