-- ============================================================
--  SISProjetorenilcenene - Script de Banco de Dados MySQL
--  Sistema de Gestão de Base Política - Renilce & Nene
--  Gerado em: 2026-03-12
-- ============================================================

-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS sisrenilcenene
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sisrenilcenene;

-- ============================================================
-- TABELA: usuarios
-- Gerencia os usuários do sistema com controle de acesso por perfil
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id              INT              NOT NULL AUTO_INCREMENT,
  nome            VARCHAR(150)     NOT NULL,
  email           VARCHAR(150)     NOT NULL,
  senha           VARCHAR(255)     NOT NULL COMMENT 'Armazenar hash bcrypt',
  perfil          ENUM(
                    'Administrador',
                    'Coordenador Geral',
                    'Coordenador de Grupo',
                    'Operador',
                    'Visualização'
                  )                NOT NULL DEFAULT 'Operador',
  grupo           ENUM(
                    'Fora da Igreja',
                    'Igreja / Pastores'
                  )                NULL      COMMENT 'Grupo ao qual o coordenador pertence',
  ativo           TINYINT(1)       NOT NULL DEFAULT 1,
  data_cadastro   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuários do sistema com perfis de acesso';

-- ============================================================
-- TABELA: liderancas
-- Núcleo do sistema: cadastro de lideranças políticas
-- ============================================================
CREATE TABLE IF NOT EXISTS liderancas (
  id                          INT              NOT NULL AUTO_INCREMENT,
  grupo                       ENUM(
                                'Fora da Igreja',
                                'Igreja / Pastores'
                              )                NOT NULL COMMENT 'Grupo/segmento da liderança',
  nome_lideranca              VARCHAR(200)     NOT NULL,
  data_aniversario            DATE             NULL,
  fone_zap                    VARCHAR(20)      NULL     COMMENT 'Apenas números, ex: 91988776655',
  cidade                      VARCHAR(100)     NULL,
  bairro                      VARCHAR(100)     NULL,
  indicacao                   VARCHAR(200)     NULL     COMMENT 'Quem indicou esta liderança',
  acompanhado_por             VARCHAR(200)     NULL     COMMENT 'Responsável pelo acompanhamento',
  situacao                    ENUM(
                                'ativo',
                                'em acompanhamento',
                                'pendente',
                                'inativo'
                              )                NOT NULL DEFAULT 'ativo',
  demanda_recebida            TEXT             NULL     COMMENT 'Demanda ou solicitação recebida',
  compromisso_politico        ENUM(
                                'Será vereador',
                                'Prefeito',
                                'Conselho Tutelar',
                                'indefinido'
                              )                NOT NULL DEFAULT 'indefinido',
  percentual_votos_municipio  DECIMAL(5,2)     NOT NULL DEFAULT 0.00 COMMENT 'Percentual estimado no município (%)',
  ultima_visita               DATE             NULL,
  votos_nene                  INT              NOT NULL DEFAULT 0 COMMENT 'Votos projetados para Nene',
  votos_renilce               INT              NOT NULL DEFAULT 0 COMMENT 'Votos projetados para Renilce',
  observacoes                 TEXT             NULL     COMMENT 'Observações internas',
  responsavel_cadastro        VARCHAR(150)     NULL,
  proxima_visita              DATE             NULL,
  prioridade                  ENUM(
                                'alta',
                                'média',
                                'baixa'
                              )                NOT NULL DEFAULT 'média',
  data_cadastro               DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao            DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_liderancas_grupo    (grupo),
  INDEX idx_liderancas_cidade   (cidade),
  INDEX idx_liderancas_situacao (situacao),
  INDEX idx_liderancas_prioridade (prioridade),
  FULLTEXT INDEX ft_liderancas_busca (nome_lideranca, cidade, bairro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cadastro principal de lideranças políticas';

-- ============================================================
-- TABELA: visitas
-- Histórico de visitas realizadas às lideranças
-- ============================================================
CREATE TABLE IF NOT EXISTS visitas (
  id            INT          NOT NULL AUTO_INCREMENT,
  lideranca_id  INT          NOT NULL,
  data_visita   DATE         NOT NULL,
  relato        TEXT         NULL     COMMENT 'Relato da visita realizada',
  responsavel   VARCHAR(150) NULL     COMMENT 'Quem realizou a visita',
  data_registro DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_visitas_lideranca (lideranca_id),
  INDEX idx_visitas_data      (data_visita),
  CONSTRAINT fk_visitas_lideranca
    FOREIGN KEY (lideranca_id) REFERENCES liderancas(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Histórico de visitas às lideranças';

-- ============================================================
-- TABELA: demandas
-- Demandas e solicitações vinculadas às lideranças
-- ============================================================
CREATE TABLE IF NOT EXISTS demandas (
  id             INT          NOT NULL AUTO_INCREMENT,
  lideranca_id   INT          NOT NULL,
  descricao      TEXT         NOT NULL COMMENT 'Descrição da demanda ou solicitação',
  status         ENUM(
                   'aberta',
                   'em andamento',
                   'concluída',
                   'cancelada'
                 )            NOT NULL DEFAULT 'aberta',
  data_abertura  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_conclusao DATETIME     NULL,
  responsavel    VARCHAR(150) NULL,
  PRIMARY KEY (id),
  INDEX idx_demandas_lideranca (lideranca_id),
  INDEX idx_demandas_status    (status),
  CONSTRAINT fk_demandas_lideranca
    FOREIGN KEY (lideranca_id) REFERENCES liderancas(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Demandas e solicitações das lideranças';

-- ============================================================
-- TABELA: agendas
-- Agenda de eventos e compromissos da campanha
-- ============================================================
CREATE TABLE IF NOT EXISTS agendas (
  id            INT                              NOT NULL AUTO_INCREMENT,
  titulo        VARCHAR(250)                     NOT NULL,
  data          DATE                             NOT NULL,
  hora          TIME                             NULL,
  cidade        VARCHAR(100)                     NOT NULL,
  local         VARCHAR(250)                     NULL     COMMENT 'Local específico do evento',
  descricao     TEXT                             NULL,
  aviso         TINYINT(1)                       NOT NULL DEFAULT 0 COMMENT '1 = alerta ativo',
  status        ENUM('confirmado','pendente','cancelado') NOT NULL DEFAULT 'pendente',
  data_cadastro DATETIME                         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_agendas_data   (data),
  INDEX idx_agendas_status (status),
  INDEX idx_agendas_cidade (cidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Agenda de eventos e compromissos da campanha';

-- ============================================================
-- TABELA: logs
-- Auditoria de ações no sistema
-- ============================================================
CREATE TABLE IF NOT EXISTS logs (
  id          INT          NOT NULL AUTO_INCREMENT,
  usuario_id  INT          NULL,
  acao        VARCHAR(100) NOT NULL COMMENT 'Ex: CREATE_LIDERANCA, UPDATE_AGENDA, DELETE_VISITA',
  detalhes    TEXT         NULL     COMMENT 'JSON com dados complementares da ação',
  ip          VARCHAR(45)  NULL,
  data_hora   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_logs_usuario  (usuario_id),
  INDEX idx_logs_data     (data_hora),
  INDEX idx_logs_acao     (acao),
  CONSTRAINT fk_logs_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Log de auditoria das ações do sistema';

-- ============================================================
-- DADOS INICIAIS (SEED)
-- ============================================================

-- Usuário administrador padrão
-- IMPORTANTE: Altere a senha após o primeiro acesso!
-- A senha 'admin123' deve ser substituída pelo hash bcrypt na aplicação.
INSERT INTO usuarios (nome, email, senha, perfil)
VALUES (
  'Administrador',
  'admin@campanha.com',
  '$2b$10$placeholder_trocar_pelo_hash_real_do_bcrypt',
  'Administrador'
) ON DUPLICATE KEY UPDATE id = id;

-- ============================================================
-- VIEWS ÚTEIS
-- ============================================================

-- View: Consolidado de votos por cidade
CREATE OR REPLACE VIEW vw_votos_por_cidade AS
SELECT
  cidade,
  COUNT(*)             AS total_liderancas,
  SUM(votos_nene)      AS votos_nene,
  SUM(votos_renilce)   AS votos_renilce,
  SUM(votos_nene + votos_renilce) AS total_votos
FROM liderancas
GROUP BY cidade
ORDER BY total_votos DESC;

-- View: Consolidado de votos por bairro
CREATE OR REPLACE VIEW vw_votos_por_bairro AS
SELECT
  bairro,
  COUNT(*)             AS total_liderancas,
  SUM(votos_nene)      AS votos_nene,
  SUM(votos_renilce)   AS votos_renilce,
  SUM(votos_nene + votos_renilce) AS total_votos
FROM liderancas
GROUP BY bairro
ORDER BY total_votos DESC;

-- View: Lideranças sem visita nos últimos 30 dias
CREATE OR REPLACE VIEW vw_sem_visita_30dias AS
SELECT
  id,
  nome_lideranca,
  fone_zap,
  cidade,
  bairro,
  ultima_visita,
  DATEDIFF(CURDATE(), ultima_visita) AS dias_sem_visita
FROM liderancas
WHERE ultima_visita IS NULL
   OR ultima_visita < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY dias_sem_visita DESC;

-- View: Ranking de lideranças por votos
CREATE OR REPLACE VIEW vw_ranking_liderancas AS
SELECT
  id,
  nome_lideranca,
  grupo,
  cidade,
  votos_nene,
  votos_renilce,
  (votos_nene + votos_renilce) AS total_votos
FROM liderancas
ORDER BY total_votos DESC;

-- View: Estatísticas gerais do dashboard
CREATE OR REPLACE VIEW vw_stats_dashboard AS
SELECT
  COUNT(*)                                  AS total,
  SUM(grupo = 'Fora da Igreja')             AS fora_igreja,
  SUM(grupo = 'Igreja / Pastores')          AS igreja,
  SUM(votos_nene)                           AS votos_nene,
  SUM(votos_renilce)                        AS votos_renilce,
  SUM(votos_nene + votos_renilce)           AS total_votos
FROM liderancas;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
