# Casos de Uso — Pet Com Você

## 1. Descrição do Sistema

**Pet Com Você**

Sistema web e mobile para gestão completa de clínicas veterinárias e pet shops. Centraliza agendamentos de serviços (consultas, banho, tosa, hotelzinho), prontuários clínicos, cartão vacinal digital, controle de estoque e PDV, orçamentos, pagamentos e notificações automáticas via WhatsApp.

**Problema que resolve:** fragmentação dos processos em clínicas veterinárias — agendas em papel, prontuários físicos, controle de estoque manual e falta de comunicação proativa com tutores.

| Usuários Principais |
|---|
| Tutores (donos de pets) |
| Veterinários |
| Recepcionistas |
| Tosadores |
| Administradores |

---

## 2. Atores do Sistema

| Ator | Descrição |
|---|---|
| **Tutor** | Dono do animal. Aprova orçamentos, realiza pagamentos online e recebe notificações via WhatsApp. |
| **Veterinário** | Registra prontuários, aplica vacinas e utiliza insumos clínicos durante o atendimento. |
| **Recepcionista** | Agenda serviços, realiza check-in, opera o PDV e cadastra tutores e pets. |
| **Tosador** | Executa serviços de banho e tosa. Visualiza sua agenda de atendimentos. |
| **Administrador** | Gerencia funcionários, produtos, estoque e relatórios financeiros. |
| **Sistema** | Executa ações automáticas: baixa de estoque, envio de notificações, alertas de reposição e jobs de lembrete. |

---

## 3. Lista de Casos de Uso

| Código | Nome | Ator Principal | Módulo |
|---|---|---|---|
| UC01 | Cadastrar tutor | Recepcionista / Administrador | `IdentidadeAcesso` |
| UC02 | Autenticar-se | Todos os atores | `IdentidadeAcesso` |
| UC03 | Cadastrar pet | Recepcionista / Administrador | `IdentidadeAcesso` |
| UC04 | Agendar serviço | Recepcionista / Administrador | `AgendamentoServicos` |
| UC05 | Realizar check-in do atendimento | Recepcionista / Administrador | `AgendamentoServicos` |
| UC06 | Registrar prontuário | Veterinário | `Clinico` |
| UC07 | Registrar vacina | Veterinário | `Clinico` |
| UC08 | Gerar e enviar orçamento | Veterinário / Administrador | `FinanceiroNotificacoes` |
| UC09 | Aprovar orçamento | Tutor | `FinanceiroNotificacoes` |
| UC10 | Processar pagamento | Recepcionista / Administrador | `FinanceiroNotificacoes` |
| UC11 | Realizar venda no PDV | Recepcionista / Administrador | `EstoquePDV` |
| UC12 | Gerenciar estoque de produtos | Administrador | `EstoquePDV` |
| UC13 | Consultar histórico clínico do pet | Veterinário / Recepcionista / Tutor | `Clinico` |
| UC14 | Enviar notificação automática | Sistema | `FinanceiroNotificacoes` |

---

## 4. Casos de Uso Detalhados

---

### UC01 — Cadastrar Tutor

**Ator Principal:** Recepcionista / Administrador

**Descrição:** Registra um novo tutor (dono de pet) no sistema, criando seu perfil com dados de contato e documento fiscal. O tutor cadastrado poderá ter pets vinculados e receberá notificações via WhatsApp.

**Pré-condições:**
- Usuário autenticado com role `RECEPTIONIST` ou `ADMIN`
- E-mail e CPF ainda não cadastrados no sistema

**Pós-condições:**
- Tutor criado e disponível para vincular pets
- Tutor apto a receber notificações via WhatsApp

**Fluxo Principal:**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Recepcionista | Acessa a tela de cadastro de novo tutor |
| 2 | Recepcionista | Preenche nome, e-mail, telefone, WhatsApp, CPF e endereço |
| 3 | Sistema | Valida campos obrigatórios e formato dos dados |
| 4 | Sistema | Verifica unicidade do e-mail e CPF |
| 5 | Sistema | Persiste o registro e retorna o tutor criado |

**Fluxos Alternativos:**

- *E-mail ou CPF já cadastrado* → sistema retorna erro 409 com identificação do campo duplicado
- *Campos obrigatórios ausentes* → sistema retorna erro 400 listando campos faltantes

**Entidades Envolvidas:** [`Tutor`](#tutor)

**Endpoint:** `POST /tutors`

**Regras Relacionadas:** —

---

### UC02 — Autenticar-se

**Ator Principal:** Todos os atores

**Descrição:** Permite que qualquer usuário do sistema (funcionário ou tutor) realize login com e-mail e senha, recebendo um token JWT para autenticar as demais requisições.

**Pré-condições:**
- Usuário previamente cadastrado no sistema (como Tutor ou Funcionário)
- Conta ativa (funcionário com `ativo = true`)

**Pós-condições:**
- Token JWT válido emitido
- Usuário identificado com seu role (`VET`, `ADMIN`, `RECEPTIONIST`, `GROOMER`, `TUTOR`)

**Fluxo Principal:**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Usuário | Acessa a tela de login |
| 2 | Usuário | Informa e-mail e senha |
| 3 | Sistema | Valida as credenciais contra o banco de dados |
| 4 | Sistema | Verifica se a conta está ativa |
| 5 | Sistema | Gera e retorna o token JWT com `id`, `nome` e `role` do usuário |

**Fluxos Alternativos:**

- *Credenciais inválidas* → sistema retorna erro 401 sem detalhar qual campo está errado (segurança)
- *Conta de funcionário inativa (`ativo = false`)* → sistema retorna erro 401 com mensagem de conta inativa

**Entidades Envolvidas:** [`Tutor`](#tutor), [`Funcionario`](#funcionario)

**Endpoint:** `POST /auth/login`

**Regras Relacionadas:** —

---

### UC03 — Cadastrar Pet

**Ator Principal:** Recepcionista / Administrador

**Descrição:** Registra um novo animal de estimação no sistema, vinculando-o ao seu tutor responsável. O pet cadastrado passa a ser o sujeito central de agendamentos, prontuários e vacinas.

**Pré-condições:**
- Usuário autenticado com role `RECEPTIONIST` ou `ADMIN`
- Tutor já cadastrado no sistema

**Pós-condições:**
- Pet criado e vinculado ao tutor informado
- Pet disponível para agendamentos e registros clínicos

**Fluxo Principal:**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Recepcionista | Acessa a ficha do tutor e seleciona "Cadastrar pet" |
| 2 | Recepcionista | Preenche nome, espécie, raça, data de nascimento, peso, sexo, castração e observações |
| 3 | Recepcionista | Faz upload da foto do animal (opcional) |
| 4 | Sistema | Valida campos obrigatórios e existência do `tutorId` |
| 5 | Sistema | Persiste o registro e retorna o pet criado |

**Fluxos Alternativos:**

- *Tutor não encontrado* → sistema retorna erro 404
- *Espécie ou sexo com valor inválido* → sistema retorna erro 400 listando os valores aceitos

**Entidades Envolvidas:** [`Pet`](#pet), [`Tutor`](#tutor)

**Endpoint:** `POST /pets`

**Regras Relacionadas:** —

---

### UC04 — Agendar Serviço

**Ator Principal:** Recepcionista / Administrador

**Descrição:** Permite registrar um agendamento de serviço (consulta, banho, tosa, hotelzinho ou retorno) para um pet em um horário específico com um profissional responsável.

**Pré-condições:**
- Usuário autenticado com role `RECEPTIONIST` ou `ADMIN`
- Tutor e pet já cadastrados no sistema
- Profissional responsável ativo e sem conflito de agenda no horário

**Pós-condições:**
- Agendamento criado com status `SCHEDULED`
- Notificação de confirmação enfileirada para o tutor via WhatsApp

**Fluxo Principal:**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Recepcionista | Acessa a tela de agendamento e seleciona o pet |
| 2 | Sistema | Exibe a agenda disponível dos profissionais |
| 3 | Recepcionista | Seleciona tipo de serviço, profissional, data e hora |
| 4 | Sistema | Verifica conflitos de agenda: agendamentos com status `SCHEDULED`, `CONFIRMED` ou `IN_PROGRESS` para o mesmo profissional no mesmo horário |
| 5 | Sistema | Se tipo = `HOTEL`: valida antirrábica e V10 do pet com `dataProximaDose > hoje` |
| 6 | Sistema | Cria agendamento com status `SCHEDULED` |
| 7 | Sistema | Enfileira notificação de confirmação via WhatsApp para o tutor |

**Fluxos Alternativos:**

- *Conflito de agenda* → sistema retorna erro 409 e sugere próximos horários disponíveis
- *Hotelzinho com vacinas vencidas ou ausentes* → sistema retorna erro 422 listando as vacinas pendentes
- *Horário cheio* → sistema oferece entrada na fila de espera (`filaDeEspera = true`)

**Entidades Envolvidas:** [`Agendamento`](#agendamento), [`Pet`](#pet), [`Funcionario`](#funcionario), [`RegistroVacinal`](#registrovacinal)

**Endpoint:** `POST /appointments`

**Regras Relacionadas:** RN01, RN03

---

### UC05 — Realizar Check-in do Atendimento

**Ator Principal:** Recepcionista / Administrador

**Descrição:** Registra a chegada do pet à clínica e inicia o atendimento, transitando o agendamento para o status `IN_PROGRESS`. Permite ao veterinário acessar o prontuário.

**Pré-condições:**
- Usuário autenticado com role `RECEPTIONIST` ou `ADMIN`
- Agendamento com status `CONFIRMED` ou `SCHEDULED`
- Orçamento vinculado com status `APPROVED` (quando houver orçamento)

**Pós-condições:**
- Agendamento com status `IN_PROGRESS`
- Histórico clínico anterior do pet disponível para o veterinário

**Fluxo Principal:**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Recepcionista | Localiza o agendamento do dia por pet, horário ou profissional |
| 2 | Recepcionista | Confirma a chegada do pet e aciona o check-in |
| 3 | Sistema | Verifica existência de orçamento vinculado |
| 4 | Sistema | Valida que o orçamento (se houver) está com status `APPROVED` |
| 5 | Sistema | Atualiza status do agendamento para `IN_PROGRESS` |
| 6 | Sistema | Carrega o histórico clínico anterior do pet para visualização |

**Fluxos Alternativos:**

- *Orçamento vinculado não aprovado* → sistema bloqueia o check-in (HTTP 422) e orienta regularização
- *Pet não compareceu* → recepcionista registra `NO_SHOW`, liberando o horário da agenda
- *Agendamento cancelado* → transição para `CANCELLED` disponível em qualquer estado não-final

**Entidades Envolvidas:** [`Agendamento`](#agendamento), [`Orcamento`](#orcamento), [`Prontuario`](#prontuario)

**Endpoint:** `PATCH /appointments/:id/status`

**Regras Relacionadas:** RN02

---

### UC06 — Registrar Prontuário

**Ator Principal:** Veterinário

**Descrição:** Permite que o veterinário responsável registre o atendimento clínico completo do pet, incluindo anamnese, diagnóstico, prescrição e insumos utilizados. O fechamento do prontuário aciona automaticamente a baixa de estoque dos insumos.

**Pré-condições:**
- Veterinário autenticado com role `VET`
- Agendamento com status `IN_PROGRESS`
- Veterinário autenticado é o `funcionarioId` do agendamento

**Pós-condições:**
- Prontuário criado e vinculado ao pet e ao agendamento
- Evento `medical-record.closed` publicado com lista de insumos
- Estoque decrementado automaticamente para cada insumo registrado
- Alerta de estoque mínimo emitido para itens abaixo do limite (quando aplicável)

**Fluxo Principal:**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Veterinário | Acessa o agendamento em andamento vinculado ao seu perfil |
| 2 | Sistema | Exibe prontuários anteriores do pet para consulta |
| 3 | Veterinário | Preenche anamnese (relato do tutor e queixas) |
| 4 | Veterinário | Registra exame clínico, diagnóstico e prescrição |
| 5 | Veterinário | Registra insumos clínicos utilizados com quantidade e observações |
| 6 | Veterinário | Define data de retorno recomendado (opcional) |
| 7 | Veterinário | Confirma e fecha o prontuário |
| 8 | Sistema | Valida que o veterinário autenticado é o responsável pelo agendamento |
| 9 | Sistema | Persiste [`Prontuario`](#prontuario) e [`InsumoProntuario`](#insumoprontuario)`[]` |
| 10 | Sistema | Publica evento `medical-record.closed` |
| 11 | Sistema | Módulo `EstoquePDV` consome o evento e decrementa cada insumo |
| 12 | Sistema | Publica `inventory.minimum-reached` para insumos abaixo do mínimo |

**Fluxos Alternativos:**

- *Veterinário não é o responsável pelo agendamento* → sistema bloqueia (HTTP 403)
- *Agendamento não está `IN_PROGRESS`* → sistema rejeita o registro (HTTP 422)
- *Insumo sem estoque suficiente* → sistema alerta via `stockAlerts`, mas não bloqueia o registro clínico

**Entidades Envolvidas:** [`Prontuario`](#prontuario), [`InsumoProntuario`](#insumoprontuario), [`Agendamento`](#agendamento), [`Produto`](#produto)

**Endpoint:** `POST /appointments/:id/medical-record`

**Regras Relacionadas:** RN06, RN07, RN08

---

### UC07 — Registrar Vacina

**Ator Principal:** Veterinário

**Descrição:** Permite ao veterinário registrar a aplicação de uma vacina em um pet, atualizando o cartão vacinal digital e agendando automaticamente o lembrete de reforço.

**Pré-condições:**
- Veterinário autenticado com role `VET` e `ativo = true`
- Pet existente no sistema
- Produto-vacina cadastrado em estoque com quantidade disponível

**Pós-condições:**
- [`RegistroVacinal`](#registrovacinal) criado e vinculado ao pet
- Estoque da vacina decrementado em 1 unidade
- Notificação de lembrete agendada para 30 dias antes de `dataProximaDose`

**Fluxo Principal:**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Veterinário | Acessa o cartão vacinal do pet |
| 2 | Sistema | Exibe histórico de vacinas aplicadas e status (em dia, vencida, ausente) |
| 3 | Veterinário | Seleciona a vacina aplicada e informa data de aplicação, lote e próxima dose |
| 4 | Veterinário | Registra observações pós-aplicação (reações, etc.) |
| 5 | Sistema | Valida existência do pet e do produto-vacina |
| 6 | Sistema | Cria `VaccinationRecord` vinculado ao pet e ao veterinário |
| 7 | Sistema | Decrementa estoque do produto-vacina |
| 8 | Sistema | Agenda notificação `VACCINE_REMINDER` para 30 dias antes de `dataProximaDose` |

**Fluxos Alternativos:**

- *Vacina sem estoque* → sistema exibe alerta; veterinário pode registrar com observação de uso de estoque externo
- *Data da próxima dose não informada* → sistema salva sem agendar lembrete

**Entidades Envolvidas:** [`RegistroVacinal`](#registrovacinal), [`Pet`](#pet), [`Funcionario`](#funcionario), [`Produto`](#produto), [`Notificacao`](#notificacao)

**Endpoint:** `POST /pets/:id/vaccines`

**Regras Relacionadas:** RN09

---

### UC08 — Gerar e Enviar Orçamento

**Ator Principal:** Veterinário / Administrador

**Descrição:** Permite criar um orçamento detalhado para um serviço e enviá-lo ao tutor via WhatsApp para aprovação antes do início ou da cobrança do atendimento.

**Pré-condições:**
- Usuário autenticado com role `VET` ou `ADMIN`
- Agendamento existente e vinculado ao pet e tutor
- Orçamento anterior (se existir) com status `REJECTED` ou `EXPIRED`

**Pós-condições:**
- [`Orcamento`](#orcamento) criado com status `PENDING`
- Notificação enviada ao tutor via WhatsApp com link de aprovação

**Fluxo Principal:**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Veterinário | Acessa o agendamento e seleciona "Gerar orçamento" |
| 2 | Veterinário | Adiciona serviços e produtos ao orçamento com valores |
| 3 | Veterinário | Adiciona observações e confirma o envio |
| 4 | Sistema | Calcula o `totalCentavos` dos itens |
| 5 | Sistema | Cria [`Orcamento`](#orcamento) com status `PENDING` e registra `dataEnvio` |
| 6 | Sistema | Envia notificação `BUDGET_PENDING` via WhatsApp ao tutor com link de resposta |

**Fluxos Alternativos:**

- *Tutor sem WhatsApp cadastrado* → sistema registra o orçamento mas sinaliza falha no envio; recepcionista contata manualmente
- *Orçamento expirado sem resposta* → sistema atualiza status para `EXPIRED` após prazo configurado

**Entidades Envolvidas:** [`Orcamento`](#orcamento), [`Agendamento`](#agendamento), [`Pet`](#pet), [`Tutor`](#tutor), [`Notificacao`](#notificacao)

**Endpoint:** `POST /budgets`

**Regras Relacionadas:** RN02

---

### UC09 — Aprovar Orçamento

**Ator Principal:** Tutor

**Descrição:** Permite ao tutor aprovar ou recusar o orçamento enviado pela clínica, respondendo diretamente pelo link recebido via WhatsApp.

**Pré-condições:**
- Tutor autenticado com role `TUTOR`
- Orçamento pertence ao tutor autenticado
- Orçamento com status `PENDING`

**Pós-condições:**
- **Se aprovado:** `Orcamento.status = APPROVED`; funcionário responsável notificado para prosseguir
- **Se recusado:** `Orcamento.status = REJECTED`; funcionário notificado com motivo informado pelo tutor

**Fluxo Principal:**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Tutor | Recebe notificação via WhatsApp e acessa o link do orçamento |
| 2 | Sistema | Exibe detalhamento dos itens e valor total do orçamento |
| 3 | Tutor | Seleciona "Aprovar" ou "Recusar" |
| 4 | Sistema | Valida que o tutor autenticado é o destinatário do orçamento |
| 5 | Sistema | Valida que o orçamento ainda está com status `PENDING` |
| 6 | Sistema | Atualiza status para `APPROVED` ou `REJECTED` e registra `dataResposta` |
| 7 | Sistema | Notifica o funcionário responsável sobre a decisão |

**Fluxos Alternativos:**

- *Tutor recusa e informa motivo* → sistema persiste `motivoRecusa` e notifica o funcionário; novo orçamento pode ser gerado (UC08)
- *Orçamento já respondido* → sistema retorna erro 422 informando que o orçamento não está mais pendente
- *Tutor não é o destinatário* → sistema retorna erro 403

**Entidades Envolvidas:** [`Orcamento`](#orcamento), [`Tutor`](#tutor), [`Notificacao`](#notificacao)

**Endpoint:** `PATCH /budgets/:id/response`

**Regras Relacionadas:** RN02

---

### UC10 — Processar Pagamento

**Ator Principal:** Recepcionista / Administrador

**Descrição:** Registra e processa o pagamento de um serviço concluído ou de uma venda no PDV, vinculando-o à referência correspondente (agendamento ou venda).

**Pré-condições:**
- Usuário autenticado com role `RECEPTIONIST` ou `ADMIN`
- Orçamento com status `APPROVED` (quando houver orçamento vinculado)
- Nenhum pagamento com status `APPROVED` já associado à referência

**Pós-condições:**
- [`Pagamento`](#pagamento) registrado com status `APPROVED`
- Agendamento atualizado para `COMPLETED` (quando aplicável)
- Evento `appointment.completed` publicado (quando aplicável)
- Notificações de retorno e vacinas agendadas pelo sistema

**Fluxo Principal:**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Recepcionista | Acessa a tela de pagamento do agendamento ou venda |
| 2 | Sistema | Exibe valor total e métodos de pagamento disponíveis |
| 3 | Recepcionista | Seleciona o método (PIX, cartão de débito, crédito, dinheiro ou boleto) |
| 4 | Sistema | Valida ausência de pagamento anterior com status `APPROVED` |
| 5 | Sistema | Valida que o orçamento está `APPROVED` (quando houver) |
| 6 | Sistema | Cria registro de [`Pagamento`](#pagamento) com status `PENDING` |
| 7 | Sistema | Processa o pagamento via método selecionado |
| 8 | Sistema | Atualiza status do pagamento para `APPROVED` |
| 9 | Sistema | Atualiza agendamento para `COMPLETED` e publica `appointment.completed` |
| 10 | Sistema | Módulo de notificações agenda lembretes de retorno e vacinas |

**Fluxos Alternativos:**

- *Pagamento recusado pelo gateway* → status atualizado para `REJECTED`; operação pode ser refeita com outro método
- *Orçamento não aprovado* → sistema bloqueia o pagamento (HTTP 422)
- *Estorno solicitado* → operação `refund` explícita cria novo registro `REFUNDED`; o original permanece `APPROVED` e imutável

**Entidades Envolvidas:** [`Pagamento`](#pagamento), [`Agendamento`](#agendamento), [`Orcamento`](#orcamento)

**Endpoint:** `POST /payments` / `POST /payments/:id/refund`

**Regras Relacionadas:** RN02, RN05

---

### UC11 — Realizar Venda no PDV

**Ator Principal:** Recepcionista / Administrador

**Descrição:** Processa a venda de produtos no balcão (PDV) para um tutor ou de forma avulsa, validando estoque, calculando valores e processando o pagamento em uma única operação.

**Pré-condições:**
- Usuário autenticado com role `RECEPTIONIST` ou `ADMIN`
- Produtos com estoque disponível suficiente

**Pós-condições:**
- [`Venda`](#venda) com status `COMPLETED` e [`Pagamento`](#pagamento) com status `APPROVED`
- Estoque decrementado para cada produto vendido
- Histórico de compras do tutor atualizado (quando identificado)
- Alerta de reposição emitido para produtos que atingiram o mínimo

**Fluxo Principal:**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Recepcionista | Abre nova venda no PDV e identifica o tutor (opcional) |
| 2 | Recepcionista | Adiciona produtos e quantidades ao carrinho |
| 3 | Sistema | Valida estoque disponível para cada item (`quantidadeEmEstoque ≥ quantidade`) |
| 4 | Sistema | Calcula preço unitário atual, subtotais e total com desconto |
| 5 | Recepcionista | Aplica desconto (opcional) e seleciona método de pagamento |
| 6 | Sistema | Cria [`Venda`](#venda) com [`ItemVenda`](#itemvenda)`[]` e [`Pagamento`](#pagamento) com status `PENDING` |
| 7 | Sistema | Processa pagamento e atualiza para `APPROVED` |
| 8 | Sistema | Decrementa estoque de cada produto |
| 9 | Sistema | Verifica alertas de estoque mínimo e publica `inventory.minimum-reached` se necessário |
| 10 | Sistema | Atualiza `Venda.status` para `COMPLETED` e registra no histórico do tutor |

**Fluxos Alternativos:**

- *Estoque insuficiente para algum item* → sistema retorna erro 422 com detalhes do produto e quantidades disponível/solicitada
- *Pagamento recusado* → venda permanece `OPEN`; recepcionista tenta outro método
- *Venda avulsa (sem tutor)* → `tutorId = null`; histórico de compras não é atualizado

**Entidades Envolvidas:** [`Venda`](#venda), [`ItemVenda`](#itemvenda), [`Produto`](#produto), [`Pagamento`](#pagamento), [`Tutor`](#tutor)

**Endpoint:** `POST /sales`

**Regras Relacionadas:** RN04, RN08

---

### UC12 — Gerenciar Estoque de Produtos

**Ator Principal:** Administrador

**Descrição:** Permite cadastrar novos produtos no catálogo, atualizar suas informações e registrar entradas de estoque (reposição). O sistema monitora automaticamente os níveis mínimos.

**Pré-condições:**
- Usuário autenticado com role `ADMIN`

**Pós-condições:**
- **Cadastro:** produto disponível para venda no PDV ou uso como insumo clínico
- **Reposição:** estoque incrementado; alertas de reposição pendentes removidos

**Fluxo Principal — Cadastrar produto:**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Administrador | Acessa o catálogo de produtos e seleciona "Novo produto" |
| 2 | Administrador | Preenche nome, descrição, categoria, preço, custo, estoque inicial, quantidade mínima, SKU e validade |
| 3 | Administrador | Define se é insumo clínico (`usoClinico = true`) |
| 4 | Sistema | Valida campos obrigatórios e unicidade do SKU |
| 5 | Sistema | Persiste o produto e disponibiliza para uso |

**Fluxo Principal — Registrar entrada de estoque:**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Administrador | Acessa o produto e seleciona "Entrada de estoque" |
| 2 | Administrador | Informa quantidade, custo unitário, validade e nota fiscal |
| 3 | Sistema | Valida permissão e dados informados |
| 4 | Sistema | Incrementa `quantidadeEmEstoque` do produto |
| 5 | Sistema | Atualiza custo e validade se informados |
| 6 | Sistema | Remove alertas de reposição pendentes para o produto |

**Fluxos Alternativos:**

- *SKU duplicado* → sistema retorna erro 409
- *Dados inválidos (preço negativo, quantidade zero)* → sistema retorna erro 400 com detalhes

**Entidades Envolvidas:** [`Produto`](#produto)

**Endpoint:** `POST /products` / `POST /products/:id/stock-entry` / `GET /products`

**Regras Relacionadas:** RN04, RN08

---

### UC13 — Consultar Histórico Clínico do Pet

**Ator Principal:** Veterinário / Recepcionista / Tutor

**Descrição:** Permite visualizar o histórico completo de um pet, incluindo prontuários anteriores, cartão vacinal, agendamentos passados e compras do tutor, em uma visão consolidada (360°).

**Pré-condições:**
- Usuário autenticado com role `VET`, `ADMIN`, `RECEPTIONIST` ou `TUTOR` (dono do pet)
- Pet existente no sistema

**Pós-condições:**
- Histórico exibido sem alterações no sistema

**Fluxo Principal:**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Usuário | Busca o pet pelo nome, tutor ou ID |
| 2 | Sistema | Verifica permissão: tutor só acessa seus próprios pets |
| 3 | Usuário | Seleciona filtros de período e tipo de histórico (clínico, vacinas, serviços, financeiro) |
| 4 | Sistema | Agrega dados de `MedicalRecords`, `VaccinationRecords`, `Appointments` e `Sales` |
| 5 | Sistema | Retorna histórico paginado e ordenado cronologicamente |

**Fluxos Alternativos:**

- *Tutor tenta acessar pet de outro tutor* → sistema retorna erro 403
- *Pet sem histórico* → sistema retorna listas vazias sem erro

**Entidades Envolvidas:** [`Pet`](#pet), [`Prontuario`](#prontuario), [`RegistroVacinal`](#registrovacinal), [`Agendamento`](#agendamento), [`Venda`](#venda)

**Endpoint:** `GET /pets/:id/history` / `GET /pets/:id/medical-records` / `GET /pets/:id/vaccines`

**Regras Relacionadas:** —

---

### UC14 — Enviar Notificação Automática

**Ator Principal:** Sistema

**Descrição:** Disparos automáticos de notificações via WhatsApp ou e-mail para tutores, acionados por eventos do domínio (fechamento de prontuário, agendamento concluído) ou por jobs diários (lembretes vacinais, ração).

**Pré-condições:**
- Tutor com WhatsApp ou e-mail cadastrado
- Evento de domínio publicado **ou** job diário em execução

**Pós-condições:**
- [`Notificacao`](#notificacao) criada com status `SENT`
- Status atualizado para `DELIVERED` ou `FAILED` conforme resposta do gateway

**Tipos de Notificação e Gatilhos:**

| Tipo | Gatilho | Canal |
|---|---|---|
| `APPOINTMENT_CONFIRMATION` | Criação de agendamento (UC04) | WhatsApp |
| `BUDGET_PENDING` | Geração de orçamento (UC08) | WhatsApp |
| `VACCINE_REMINDER` | Job diário — 30 dias antes de `dataProximaDose` | WhatsApp |
| `FOOD_RESTOCK` | Job diário — ≤ 5 dias para fim estimado de ração | WhatsApp |
| `PROMOTION` | Disparo manual pelo Administrador | WhatsApp / E-mail |

**Fluxo Principal (lembrete vacinal):**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Sistema (cron diário) | Consulta `vaccination_records` com `dataProximaDose` entre hoje e +30 dias |
| 2 | Sistema | Para cada registro encontrado, verifica se já existe notificação recente enviada |
| 3 | Sistema | Cria [`Notificacao`](#notificacao) do tipo `VACCINE_REMINDER` para o tutor do pet |
| 4 | Sistema | Envia a mensagem via WhatsApp Business API de forma assíncrona |
| 5 | Sistema | Atualiza status da notificação para `DELIVERED` ou `FAILED` conforme resposta |

**Fluxo Principal (notificação preditiva de ração):**

| Passo | Ator | Ação |
|---|---|---|
| 1 | Sistema (cron diário) | Analisa histórico de compras de ração por tutor |
| 2 | Sistema | Calcula intervalo médio entre compras e estima data de esgotamento |
| 3 | Sistema | Quando restam ≤ 5 dias, cria [`Notificacao`](#notificacao) do tipo `FOOD_RESTOCK` |
| 4 | Sistema | Envia WhatsApp com link de pagamento integrado para recompra imediata |
| 5 | Tutor | Clica no link, confirma quantidade e realiza pagamento |
| 6 | Sistema | Registra nova [`Venda`](#venda) e recalcula próximo ciclo |

**Fluxos Alternativos:**

- *Falha no gateway de WhatsApp* → notificação marcada como `FAILED`; não bloqueia nenhum fluxo principal
- *Tutor sem WhatsApp cadastrado* → notificação não criada; administrador alertado via painel

**Entidades Envolvidas:** [`Notificacao`](#notificacao), [`Tutor`](#tutor), [`RegistroVacinal`](#registrovacinal), [`Venda`](#venda)

**Endpoint:** `GET /notifications` (consulta) — disparos são internos (sem endpoint público)

**Regras Relacionadas:** RN09, RN10

---

## 5. Entidades do Domínio

---

### Tutor

Responsável legal pelo animal. Cliente do estabelecimento e titular financeiro das operações.

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único gerado automaticamente |
| `nome` | string | Sim | Nome completo |
| `email` | string | Sim | E-mail para autenticação e contato (único) |
| `telefone` | string | Não | Telefone principal |
| `whatsapp` | string | Não | Número para notificações automáticas |
| `cpf` | string | Sim | Documento para emissão fiscal (único) |
| `endereco` | string | Não | Endereço completo |
| `created_at` | timestamptz | Auto | Data de criação |
| `updated_at` | timestamptz | Auto | Data da última atualização |

**Módulo:** `IdentidadeAcesso` | **Tabela:** `tutors`

**Relacionamentos:**
- Um Tutor possui **N** [`Pet`](#pet)**s**
- Um Tutor recebe **N** [`Notificacao`](#notificacao)**ções**
- Um Tutor pode ter **N** [`Venda`](#venda)**s** associadas
- Um Tutor responde **N** [`Orcamento`](#orcamento)**s**

---

### Pet

Animal de estimação vinculado a um tutor. Sujeito central — ao redor dele giram agendamentos, prontuários, vacinas e histórico clínico.

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único |
| `tutorId` | UUID | Sim | FK → [Tutor](#tutor) responsável |
| `nome` | string | Sim | Nome do animal |
| `especie` | enum | Sim | `DOG`, `CAT`, `BIRD`, `REPTILE`, `OTHER` |
| `raca` | string | Não | Raça do animal |
| `dataNascimento` | date | Não | Data de nascimento |
| `peso` | decimal | Não | Peso atual em kg (atualizado a cada atendimento) |
| `sexo` | enum | Não | `MALE`, `FEMALE` |
| `castrado` | boolean | Não | Indica se o animal é castrado |
| `observacoes` | text | Não | Alergias, condições especiais, temperamento |
| `fotoUrl` | string | Não | URL da foto do animal |
| `created_at` | timestamptz | Auto | Data de criação |
| `updated_at` | timestamptz | Auto | Data da última atualização |

**Módulo:** `IdentidadeAcesso` | **Tabela:** `pets`

**Relacionamentos:**
- Pertence a **1** [`Tutor`](#tutor)
- Possui **N** [`Agendamento`](#agendamento)**s**
- Possui **N** [`Prontuario`](#prontuario)**s**
- Possui **N** [`RegistroVacinal`](#registrovacinal)

---

### Funcionario

Colaborador interno do estabelecimento. Pode ser veterinário, tosador, recepcionista ou gerente.

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único |
| `nome` | string | Sim | Nome completo |
| `email` | string | Sim | E-mail para login (único) |
| `cargo` | enum | Sim | `VET`, `GROOMER`, `RECEPTIONIST`, `MANAGER` |
| `crmv` | string | Condicional | Registro profissional (obrigatório para `VET`) |
| `ativo` | boolean | Sim | Status de atividade no sistema |
| `especialidades` | string[] | Não | Lista de especialidades (apenas para `VET`) |
| `created_at` | timestamptz | Auto | Data de criação |
| `updated_at` | timestamptz | Auto | Data da última atualização |

**Módulo:** `IdentidadeAcesso` | **Tabela:** `employees`

**Relacionamentos:**
- Um Funcionário possui **N** [`Agendamento`](#agendamento)**s** como responsável
- Um Funcionário (VET) cria **N** [`Prontuario`](#prontuario)**s**
- Um Funcionário (VET) aplica **N** [`RegistroVacinal`](#registrovacinal)

---

### Agendamento

Reserva de horário para qualquer tipo de serviço. Raiz do agregado `ServicoAgendado`.

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único |
| `petId` | UUID | Sim | FK → [Pet](#pet) |
| `funcionarioId` | UUID | Sim | FK → [Funcionario](#funcionario) responsável |
| `tipo` | enum | Sim | `CONSULTATION`, `BATH`, `GROOMING`, `BATH_GROOMING`, `HOTEL`, `RETURN` |
| `dataHora` | timestamptz | Sim | Data e hora do serviço |
| `duracao` | integer | Não | Duração estimada em minutos |
| `status` | enum | Sim | `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW` |
| `observacoes` | text | Não | Informações adicionais |
| `filaDeEspera` | boolean | Não | Indica se está na fila de espera |
| `created_at` | timestamptz | Auto | Data de criação |
| `updated_at` | timestamptz | Auto | Data da última atualização |

**Ciclo de status:**
```
SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED
                    ↓
                CANCELLED
                NO_SHOW
```

**Módulo:** `AgendamentoServicos` | **Tabela:** `appointments`

**Relacionamentos:**
- Pertence a **1** [`Pet`](#pet)
- Pertence a **1** [`Funcionario`](#funcionario)
- Pode ter **1** [`Prontuario`](#prontuario) (quando tipo = `CONSULTATION`)
- Pode ter **1** [`Orcamento`](#orcamento)
- Pode ter **1** [`Pagamento`](#pagamento)

---

### Prontuario

Registro clínico completo do atendimento. Raiz do agregado `AtendimentoClinico`.

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único |
| `petId` | UUID | Sim | FK → [Pet](#pet) |
| `veterinarioId` | UUID | Sim | FK → [Funcionario](#funcionario) (cargo `VET`) |
| `agendamentoId` | UUID | Sim | FK → [Agendamento](#agendamento) de origem |
| `data` | timestamptz | Sim | Data e hora do atendimento |
| `anamnese` | text | Não | Relato do tutor e queixas |
| `exameClinico` | text | Não | Observações do exame físico |
| `diagnostico` | text | Não | Diagnóstico do veterinário |
| `prescricao` | text | Não | Receituário e orientações |
| `retornoRecomendado` | date | Não | Data sugerida para retorno |
| `created_at` | timestamptz | Auto | Data de criação |
| `updated_at` | timestamptz | Auto | Data da última atualização |

**Restrição:** apenas o veterinário vinculado ao agendamento pode editar após criação.

**Módulo:** `Clinico` | **Tabela:** `medical_records`

**Relacionamentos:**
- Pertence a **1** [`Pet`](#pet)
- Pertence a **1** [`Agendamento`](#agendamento)
- Criado por **1** [`Funcionario`](#funcionario) (VET)
- Contém **N** [`InsumoProntuario`](#insumoprontuario)

---

### InsumoProntuario

Item de insumo clínico registrado dentro de um prontuário. Não existe independentemente do [Prontuario](#prontuario).

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único |
| `prontuarioId` | UUID | Sim | FK → [Prontuario](#prontuario) |
| `produtoId` | UUID | Sim | FK → [Produto](#produto) (tipo `CLINICAL_SUPPLY`) |
| `quantidade` | integer | Sim | Quantidade utilizada |
| `observacoes` | text | Não | Observações sobre o uso |
| `created_at` | timestamptz | Auto | Data de criação |

**Módulo:** `Clinico` | **Tabela:** `medical_record_supplies`

**Relacionamentos:**
- Pertence a **1** [`Prontuario`](#prontuario)
- Referencia **1** [`Produto`](#produto)

---

### RegistroVacinal

Aplicação de vacina realizada em um pet. Mantém o cartão vacinal digital.

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único |
| `petId` | UUID | Sim | FK → [Pet](#pet) |
| `vacinaId` | UUID | Sim | FK → [Produto](#produto) (tipo vacina) |
| `veterinarioId` | UUID | Sim | FK → [Funcionario](#funcionario) (cargo `VET`) |
| `dataAplicacao` | date | Sim | Data da aplicação |
| `dataProximaDose` | date | Não | Data calculada para o reforço |
| `lote` | string | Não | Lote do imunobiológico |
| `observacoes` | text | Não | Reações ou observações pós-aplicação |
| `created_at` | timestamptz | Auto | Data de criação |

**Efeito colateral:** ao criar, agenda notificação de lembrete para 30 dias antes de `dataProximaDose`.

**Módulo:** `Clinico` | **Tabela:** `vaccination_records`

**Relacionamentos:**
- Pertence a **1** [`Pet`](#pet)
- Aplicado por **1** [`Funcionario`](#funcionario) (VET)
- Referencia **1** [`Produto`](#produto) (vacina)

---

### Produto

Item comercializado ou consumido internamente. Cobre varejo (venda ao tutor) e insumos clínicos (consumo interno durante atendimento).

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único |
| `nome` | string | Sim | Nome do produto |
| `descricao` | text | Não | Descrição detalhada |
| `categoria` | enum | Sim | `FOOD`, `MEDICINE`, `ACCESSORY`, `CLINICAL_SUPPLY`, `HYGIENE` |
| `precoCentavos` | integer | Sim | Preço de venda em centavos |
| `custoUnitarioCentavos` | integer | Sim | Custo de aquisição em centavos |
| `quantidadeEmEstoque` | integer | Sim | Quantidade disponível |
| `quantidadeMinima` | integer | Sim | Nível de alerta de reposição |
| `dataValidade` | date | Não | Validade (perecíveis e medicamentos) |
| `sku` | string | Não | Código interno do produto (único) |
| `usoClinico` | boolean | Sim | `true` = insumo com baixa automática ao fechar prontuário |
| `created_at` | timestamptz | Auto | Data de criação |
| `updated_at` | timestamptz | Auto | Data da última atualização |

**Módulo:** `EstoquePDV` | **Tabela:** `products`

**Relacionamentos:**
- Referenciado por **N** [`ItemVenda`](#itemvenda)
- Referenciado por **N** [`InsumoProntuario`](#insumoprontuario)
- Referenciado por **N** [`RegistroVacinal`](#registrovacinal) (quando é vacina)

---

### Venda

Transação comercial de produtos no PDV. Raiz do agregado `TransacaoComercial`.

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único |
| `tutorId` | UUID | Não | FK → [Tutor](#tutor) (nulo para vendas avulsas) |
| `funcionarioId` | UUID | Sim | FK → [Funcionario](#funcionario) que realizou a venda |
| `data` | timestamptz | Sim | Data e hora da venda |
| `status` | enum | Sim | `OPEN`, `COMPLETED`, `CANCELLED` |
| `subtotalCentavos` | integer | Sim | Valor sem descontos em centavos |
| `descontoCentavos` | integer | Sim | Desconto aplicado em centavos |
| `totalCentavos` | integer | Sim | Valor final em centavos |
| `observacoes` | text | Não | Informações adicionais |
| `created_at` | timestamptz | Auto | Data de criação |
| `updated_at` | timestamptz | Auto | Data da última atualização |

**Módulo:** `EstoquePDV` | **Tabela:** `sales`

**Relacionamentos:**
- Pode pertencer a **1** [`Tutor`](#tutor) (opcional)
- Realizada por **1** [`Funcionario`](#funcionario)
- Contém **N** [`ItemVenda`](#itemvenda)
- Possui **1** [`Pagamento`](#pagamento)

---

### ItemVenda

Produto incluído em uma venda. Não existe independentemente da [Venda](#venda).

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único |
| `vendaId` | UUID | Sim | FK → [Venda](#venda) |
| `produtoId` | UUID | Sim | FK → [Produto](#produto) |
| `quantidade` | integer | Sim | Quantidade vendida |
| `precoUnitarioCentavos` | integer | Sim | Preço no momento da venda em centavos |
| `subtotalCentavos` | integer | Sim | `quantidade × precoUnitario` em centavos |
| `created_at` | timestamptz | Auto | Data de criação |

**Módulo:** `EstoquePDV` | **Tabela:** `sale_items`

**Relacionamentos:**
- Pertence a **1** [`Venda`](#venda)
- Referencia **1** [`Produto`](#produto)

---

### Orcamento

Proposta de serviço enviada ao tutor para aprovação antes da execução. Não existe independentemente do [Agendamento](#agendamento).

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único |
| `agendamentoId` | UUID | Sim | FK → [Agendamento](#agendamento) |
| `petId` | UUID | Sim | FK → [Pet](#pet) |
| `tutorId` | UUID | Sim | FK → [Tutor](#tutor) que receberá o orçamento |
| `totalCentavos` | integer | Sim | Valor total em centavos |
| `status` | enum | Sim | `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED` |
| `dataEnvio` | timestamptz | Não | Momento do envio ao tutor |
| `dataResposta` | timestamptz | Não | Momento da resposta do tutor |
| `motivoRecusa` | text | Não | Preenchido quando `status = REJECTED` |
| `observacoes` | text | Não | Observações do profissional |
| `created_at` | timestamptz | Auto | Data de criação |
| `updated_at` | timestamptz | Auto | Data da última atualização |

**Ciclo de status:**
```
PENDING → APPROVED
        → REJECTED
        → EXPIRED
```

**Módulo:** `FinanceiroNotificacoes` | **Tabela:** `budgets`

**Relacionamentos:**
- Pertence a **1** [`Agendamento`](#agendamento)
- Pertence a **1** [`Pet`](#pet)
- Respondido por **1** [`Tutor`](#tutor)

---

### Pagamento

Transação financeira vinculada a uma venda ou agendamento concluído.

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único |
| `referenciaId` | UUID | Sim | ID da venda ou agendamento |
| `tipoReferencia` | enum | Sim | `SALE`, `APPOINTMENT` |
| `valorCentavos` | integer | Sim | Valor cobrado em centavos |
| `metodo` | enum | Sim | `CASH`, `DEBIT_CARD`, `CREDIT_CARD`, `PIX`, `BOLETO` |
| `status` | enum | Sim | `PENDING`, `APPROVED`, `REJECTED`, `REFUNDED` |
| `dataProcessamento` | timestamptz | Não | Momento do processamento |
| `codigoTransacao` | string | Não | Código externo do gateway (quando aplicável) |
| `created_at` | timestamptz | Auto | Data de criação |
| `updated_at` | timestamptz | Auto | Data da última atualização |

**Ciclo de status:**
```
PENDING → APPROVED
        → REJECTED
        → REFUNDED (apenas via operação `refund` explícita)
```

**Restrição:** status `APPROVED` é imutável. Estorno cria novo registro `REFUNDED`; o original permanece intocado.

**Módulo:** `FinanceiroNotificacoes` | **Tabela:** `payments`

**Relacionamentos:**
- Vinculado a **1** [`Venda`](#venda) ou **1** [`Agendamento`](#agendamento) (via `referenciaId`)

---

### Notificacao

Aviso enviado ao tutor via WhatsApp ou e-mail. Disparado de forma assíncrona — nunca bloqueia o fluxo principal.

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único |
| `tutorId` | UUID | Sim | FK → [Tutor](#tutor) destinatário |
| `tipo` | enum | Sim | `VACCINE_REMINDER`, `FOOD_RESTOCK`, `APPOINTMENT_CONFIRMATION`, `BUDGET_PENDING`, `PROMOTION` |
| `canal` | enum | Sim | `WHATSAPP`, `EMAIL` |
| `mensagem` | text | Sim | Conteúdo da mensagem |
| `dataEnvio` | timestamptz | Não | Momento do envio |
| `status` | enum | Sim | `SENT`, `DELIVERED`, `READ`, `FAILED` |
| `linkAcao` | string | Não | Link de pagamento ou confirmação (quando aplicável) |
| `created_at` | timestamptz | Auto | Data de criação |

**Ciclo de status:**
```
SENT → DELIVERED → READ
     → FAILED
```

**Módulo:** `FinanceiroNotificacoes` | **Tabela:** `notifications`

**Relacionamentos:**
- Pertence a **1** [`Tutor`](#tutor)

---

## 6. Regras de Negócio

| Código | Descrição | Contexto | Condição | Ação |
|---|---|---|---|---|
| RN01 | Agendamento só pode ser criado se o profissional estiver livre no horário | Criação de agendamento | Profissional já possui agendamento `SCHEDULED`, `CONFIRMED` ou `IN_PROGRESS` no mesmo horário | Bloquear criação (HTTP 409) e informar conflito |
| RN02 | Serviço só inicia com orçamento aprovado | Check-in / início de atendimento | Agendamento possui orçamento vinculado com status diferente de `APPROVED` | Bloquear transição para `IN_PROGRESS` (HTTP 422) |
| RN03 | Hotelzinho bloqueado se vacinas obrigatórias estiverem vencidas ou ausentes | Agendamento do tipo `HOTEL` | Antirrábica ou Múltipla V10 do pet estão vencidas ou sem registro | Rejeitar agendamento (HTTP 422) e listar vacinas pendentes |
| RN04 | Estoque negativo é proibido | Venda no PDV e baixa de insumos | `quantidadeEmEstoque < quantidadeRequisitada` | Bloquear inclusão do item na venda (HTTP 422) |
| RN05 | Pagamento aprovado é imutável | Gestão de pagamentos | Pagamento com status `APPROVED` sofre tentativa de alteração direta | Rejeitar operação (HTTP 422); estorno somente via `refund` explícito |
| RN06 | Prontuário só pode ser editado pelo veterinário responsável | Registro e edição de prontuário | Veterinário autenticado é diferente do `funcionarioId` do agendamento | Bloquear operação (HTTP 403) |
| RN07 | Fechamento de prontuário aciona baixa automática de estoque | Fechamento de prontuário | Prontuário fechado com `insumosUtilizados` preenchido | Publicar `medical-record.closed` e decrementar estoque de cada insumo |
| RN08 | Alerta de reposição quando estoque atinge quantidade mínima | Qualquer baixa de estoque | `quantidadeEmEstoque ≤ quantidadeMinima` após baixa | Publicar `inventory.minimum-reached` e notificar administrador |
| RN09 | Lembrete vacinal enviado 30 dias antes do vencimento | Job diário | `dataProximaDose - hoje ≤ 30 dias` | Gerar e enviar notificação `VACCINE_REMINDER` via WhatsApp ao tutor |
| RN10 | Notificação preditiva de ração enviada quando restam ≤ 5 dias para o fim estimado | Job diário | Data estimada de esgotamento - hoje ≤ 5 dias | Gerar `FOOD_RESTOCK` com link de pagamento e enviar via WhatsApp |

---

## 7. Conexão com o Sistema Projetado

| Caso de Uso | Tela | Endpoint | Entidade | Módulo |
|---|---|---|---|---|
| UC01 — Cadastrar tutor | Cadastro de tutor | `POST /tutors` | [`Tutor`](#tutor) | `IdentidadeAcesso` |
| UC02 — Autenticar-se | Login | `POST /auth/login` | [`Tutor`](#tutor) / [`Funcionario`](#funcionario) | `IdentidadeAcesso` |
| UC03 — Cadastrar pet | Cadastro de pet | `POST /pets` | [`Pet`](#pet) | `IdentidadeAcesso` |
| UC04 — Agendar serviço | Agenda / Novo agendamento | `POST /appointments` | [`Agendamento`](#agendamento) | `AgendamentoServicos` |
| UC05 — Realizar check-in | Agenda / Atendimento do dia | `PATCH /appointments/:id/status` | [`Agendamento`](#agendamento) | `AgendamentoServicos` |
| UC06 — Registrar prontuário | Atendimento / Prontuário clínico | `POST /appointments/:id/medical-record` | [`Prontuario`](#prontuario) + [`InsumoProntuario`](#insumoprontuario)`[]` | `Clinico` |
| UC07 — Registrar vacina | Cartão vacinal / Nova vacina | `POST /pets/:id/vaccines` | [`RegistroVacinal`](#registrovacinal) | `Clinico` |
| UC08 — Gerar orçamento | Atendimento / Orçamento | `POST /budgets` | [`Orcamento`](#orcamento) | `FinanceiroNotificacoes` |
| UC09 — Aprovar orçamento | Portal do tutor / Orçamentos | `PATCH /budgets/:id/response` | [`Orcamento`](#orcamento) | `FinanceiroNotificacoes` |
| UC10 — Processar pagamento | Caixa / Pagamento | `POST /payments` | [`Pagamento`](#pagamento) | `FinanceiroNotificacoes` |
| UC11 — Realizar venda no PDV | PDV / Nova venda | `POST /sales` | [`Venda`](#venda) + [`ItemVenda`](#itemvenda)`[]` | `EstoquePDV` |
| UC12 — Gerenciar estoque | Estoque / Catálogo de produtos | `POST /products` / `POST /products/:id/stock-entry` | [`Produto`](#produto) | `EstoquePDV` |
| UC13 — Consultar histórico | Ficha do pet / Histórico | `GET /pets/:id/history` | [`Pet`](#pet) + agregados | `Clinico` |
| UC14 — Enviar notificação | — (automático) | Interno (jobs e eventos) | [`Notificacao`](#notificacao) | `FinanceiroNotificacoes` |

---

## 8. Reflexão Arquitetural

| Dimensão | Análise |
|---|---|
| **Alinhamento com os casos de uso** | O sistema está plenamente alinhado com os casos de uso definidos. Cada funcionalidade principal possui módulo NestJS dedicado, endpoints REST mapeados, entidade de domínio correspondente e regras de negócio implementadas na camada de domínio — não nas controllers. Os eventos assíncronos (`medical-record.closed`, `appointment.completed`, `inventory.minimum-reached`) garantem o desacoplamento entre módulos sem violar as fronteiras. |
| **Funcionalidades desnecessárias** | Não foram identificadas funcionalidades fora do escopo do domínio. O módulo `FinanceiroNotificacoes` concentra responsabilidades que poderiam futuramente ser separadas (financeiro e notificações), mas por ora a fronteira é aceitável dado o volume do sistema. |
| **Ponto de evolução identificado** | O fluxo de aprovação de orçamento ainda depende de interação do tutor via link externo. Um portal web para o tutor (com login próprio) permitiria histórico de orçamentos, pagamentos recorrentes, acompanhamento de vacinas e agendamento de serviços diretamente — sem depender da recepção para operações rotineiras. |

---

## Checklist de Entrega

- [x] Descrição do sistema incluída
- [x] Atores do sistema definidos (6 atores)
- [x] Lista com 14 casos de uso apresentada
- [x] Todos os 14 casos de uso detalhados por completo
- [x] Todas as 11 entidades do domínio documentadas com atributos e relacionamentos
- [x] 10 regras de negócio descritas no formato solicitado
- [x] Conexão com o sistema projetado para todos os casos de uso (tela, endpoint, entidade, módulo)
- [x] Reflexão arquitetural respondida
- [x] Documento organizado com clareza textual
