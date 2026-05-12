-- =============================================================
-- Seeds para UC05 - Realizar Check-in do Atendimento
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Tutor (tabela mínima, apenas id)
-- ---------------------------------------------------------------
INSERT INTO tutors (id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------
-- 2. Pet vinculado ao Tutor
-- ---------------------------------------------------------------
INSERT INTO pets (id)
VALUES ('bbbbbbbb-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------
-- 3. Funcionário (veterinário responsável)
-- ---------------------------------------------------------------
INSERT INTO employees (id)
VALUES ('cccccccc-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------
-- 4. Agendamento CONFIRMADO + orçamento APROVADO (caminho feliz)
-- ---------------------------------------------------------------
INSERT INTO appointments (id, "dataHora", duracao, tipo, status, "petId", "funcionarioId", observacoes, "createdAt", "updatedAt")
VALUES (
  'dddddddd-0000-0000-0000-000000000004',
  NOW() + INTERVAL '1 hour',
  30,
  'CONSULTA',
  'CONFIRMADO',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'cccccccc-0000-0000-0000-000000000003',
  'Consulta de rotina',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO budgets (id, "appointmentId", valor, status, "createdAt", "updatedAt")
VALUES (
  'eeeeeeee-0000-0000-0000-000000000005',
  'dddddddd-0000-0000-0000-000000000004',
  150.00,
  'APROVADO',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------
-- 5. Agendamento CONFIRMADO + orçamento PENDENTE  → erro 422 (RN02)
-- ---------------------------------------------------------------
INSERT INTO appointments (id, "dataHora", duracao, tipo, status, "petId", "funcionarioId", observacoes, "createdAt", "updatedAt")
VALUES (
  'ffffffff-0000-0000-0000-000000000006',
  NOW() + INTERVAL '2 hours',
  30,
  'BANHO_TOSA',
  'CONFIRMADO',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'cccccccc-0000-0000-0000-000000000003',
  'Banho e tosa',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO budgets (id, "appointmentId", valor, status, "createdAt", "updatedAt")
VALUES (
  'a0000000-0000-0000-0000-000000000007',
  'ffffffff-0000-0000-0000-000000000006',
  80.00,
  'PENDENTE',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------
-- 6. Agendamento CANCELADO  → erro 409 (status incompatível)
-- ---------------------------------------------------------------
INSERT INTO appointments (id, "dataHora", duracao, tipo, status, "petId", "funcionarioId", observacoes, "createdAt", "updatedAt")
VALUES (
  'b0000000-0000-0000-0000-000000000008',
  NOW() - INTERVAL '1 day',
  30,
  'CONSULTA',
  'CANCELADO',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'cccccccc-0000-0000-0000-000000000003',
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
