import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.sqlite");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    perfil TEXT NOT NULL, -- Administrador, Coordenador Geral, Coordenador de Grupo, Operador, Visualização
    grupo TEXT, -- Fora da Igreja, Igreja / Pastores
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS liderancas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grupo TEXT NOT NULL, -- Fora da Igreja, Igreja / Pastores
    nome_lideranca TEXT NOT NULL,
    data_aniversario DATE,
    fone_zap TEXT,
    cidade TEXT,
    bairro TEXT,
    indicacao TEXT,
    acompanhado_por TEXT,
    situacao TEXT DEFAULT 'ativo', -- ativo, em acompanhamento, pendente, inativo
    demanda_recebida TEXT,
    compromisso_politico TEXT DEFAULT 'indefinido', -- forte, médio, baixo, indefinido
    percentual_votos_municipio REAL DEFAULT 0,
    ultima_visita DATE,
    votos_nene INTEGER DEFAULT 0,
    votos_renilce INTEGER DEFAULT 0,
    observacoes TEXT,
    responsavel_cadastro TEXT,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    proxima_visita DATE,
    prioridade TEXT DEFAULT 'média' -- alta, média, baixa
  );

  CREATE TABLE IF NOT EXISTS visitas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lideranca_id INTEGER,
    data_visita DATE,
    relato TEXT,
    responsavel TEXT,
    FOREIGN KEY (lideranca_id) REFERENCES liderancas(id)
  );

  CREATE TABLE IF NOT EXISTS demandas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lideranca_id INTEGER,
    descricao TEXT,
    status TEXT DEFAULT 'aberta',
    data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_conclusao DATETIME,
    FOREIGN KEY (lideranca_id) REFERENCES liderancas(id)
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    acao TEXT,
    detalhes TEXT,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS agendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    data DATE NOT NULL,
    hora TEXT,
    cidade TEXT NOT NULL,
    local TEXT,
    descricao TEXT,
    aviso INTEGER DEFAULT 0, -- 0 for false, 1 for true
    status TEXT DEFAULT 'pendente', -- confirmado, pendente, cancelado
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add acompanhado_por if it doesn't exist
try {
  db.prepare("ALTER TABLE liderancas ADD COLUMN acompanhado_por TEXT").run();
} catch (e) {
  // Column already exists or table doesn't exist yet
}

// Seed Admin if not exists
const adminExists = db.prepare("SELECT * FROM usuarios WHERE email = ?").get("admin@campanha.com");
if (!adminExists) {
  db.prepare("INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)").run(
    "Administrador",
    "admin@campanha.com",
    "admin123",
    "Administrador"
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/stats", (req, res) => {
    const total = db.prepare("SELECT COUNT(*) as count FROM liderancas").get().count;
    const foraIgreja = db.prepare("SELECT COUNT(*) as count FROM liderancas WHERE grupo = 'Fora da Igreja'").get().count;
    const igreja = db.prepare("SELECT COUNT(*) as count FROM liderancas WHERE grupo = 'Igreja / Pastores'").get().count;
    const votosNene = db.prepare("SELECT SUM(votos_nene) as sum FROM liderancas").get().sum || 0;
    const votosRenilce = db.prepare("SELECT SUM(votos_renilce) as sum FROM liderancas").get().sum || 0;
    
    const rankingCidades = db.prepare(`
      SELECT cidade, SUM(votos_nene + votos_renilce) as total_votos 
      FROM liderancas 
      GROUP BY cidade 
      ORDER BY total_votos DESC 
      LIMIT 5
    `).all();

    const rankingBairros = db.prepare(`
      SELECT bairro, SUM(votos_nene + votos_renilce) as total_votos 
      FROM liderancas 
      GROUP BY bairro 
      ORDER BY total_votos DESC 
      LIMIT 5
    `).all();

    res.json({
      total,
      foraIgreja,
      igreja,
      votosNene,
      votosRenilce,
      rankingCidades,
      rankingBairros
    });
  });

  app.get("/api/liderancas", (req, res) => {
    const { search, grupo, cidade, situacao } = req.query;
    let query = "SELECT * FROM liderancas WHERE 1=1";
    const params = [];

    if (search) {
      query += " AND (nome_lideranca LIKE ? OR fone_zap LIKE ? OR cidade LIKE ? OR bairro LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (grupo) {
      query += " AND grupo = ?";
      params.push(grupo);
    }
    if (cidade) {
      query += " AND cidade = ?";
      params.push(cidade);
    }
    if (situacao) {
      query += " AND situacao = ?";
      params.push(situacao);
    }

    query += " ORDER BY data_atualizacao DESC";
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  });

  app.post("/api/liderancas", (req, res) => {
    const data = req.body;
    const stmt = db.prepare(`
      INSERT INTO liderancas (
        grupo, nome_lideranca, data_aniversario, fone_zap, cidade, bairro, 
        indicacao, acompanhado_por, situacao, demanda_recebida, compromisso_politico, 
        percentual_votos_municipio, ultima_visita, votos_nene, votos_renilce, 
        observacoes, responsavel_cadastro, proxima_visita, prioridade
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      data.grupo, data.nome_lideranca, data.data_aniversario, data.fone_zap, data.cidade, data.bairro,
      data.indicacao, data.acompanhado_por, data.situacao, data.demanda_recebida, data.compromisso_politico,
      data.percentual_votos_municipio, data.ultima_visita, data.votos_nene, data.votos_renilce,
      data.observacoes, data.responsavel_cadastro, data.proxima_visita, data.prioridade
    );
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/liderancas/:id", (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const stmt = db.prepare(`
      UPDATE liderancas SET 
        grupo = ?, nome_lideranca = ?, data_aniversario = ?, fone_zap = ?, cidade = ?, bairro = ?, 
        indicacao = ?, acompanhado_por = ?, situacao = ?, demanda_recebida = ?, compromisso_politico = ?, 
        percentual_votos_municipio = ?, ultima_visita = ?, votos_nene = ?, votos_renilce = ?, 
        observacoes = ?, data_atualizacao = CURRENT_TIMESTAMP, proxima_visita = ?, prioridade = ?
      WHERE id = ?
    `);
    stmt.run(
      data.grupo, data.nome_lideranca, data.data_aniversario, data.fone_zap, data.cidade, data.bairro,
      data.indicacao, data.acompanhado_por, data.situacao, data.demanda_recebida, data.compromisso_politico,
      data.percentual_votos_municipio, data.ultima_visita, data.votos_nene, data.votos_renilce,
      data.observacoes, data.proxima_visita, data.prioridade, id
    );
    res.json({ success: true });
  });

  app.get("/api/liderancas/:id", (req, res) => {
    const row = db.prepare("SELECT * FROM liderancas WHERE id = ?").get(req.params.id);
    res.json(row);
  });

  app.get("/api/liderancas/:id/visitas", (req, res) => {
    const rows = db.prepare("SELECT * FROM visitas WHERE lideranca_id = ? ORDER BY data_visita DESC").all(req.params.id);
    res.json(rows);
  });

  app.post("/api/liderancas/:id/visitas", (req, res) => {
    const { id } = req.params;
    const { data_visita, relato, responsavel } = req.body;
    db.prepare("INSERT INTO visitas (lideranca_id, data_visita, relato, responsavel) VALUES (?, ?, ?, ?)").run(id, data_visita, relato, responsavel);
    db.prepare("UPDATE liderancas SET ultima_visita = ? WHERE id = ?").run(data_visita, id);
    res.json({ success: true });
  });

  app.get("/api/liderancas/:id/demandas", (req, res) => {
    const rows = db.prepare("SELECT * FROM demandas WHERE lideranca_id = ? ORDER BY data_abertura DESC").all(req.params.id);
    res.json(rows);
  });

  app.post("/api/liderancas/:id/demandas", (req, res) => {
    const { id } = req.params;
    const { descricao } = req.body;
    db.prepare("INSERT INTO demandas (lideranca_id, descricao) VALUES (?, ?)").run(id, descricao);
    res.json({ success: true });
  });

  // Agenda Routes
  app.get("/api/agendas", (req, res) => {
    const rows = db.prepare("SELECT * FROM agendas ORDER BY data ASC, hora ASC").all();
    res.json(rows);
  });

  app.post("/api/agendas", (req, res) => {
    const data = req.body;
    const stmt = db.prepare(`
      INSERT INTO agendas (titulo, data, hora, cidade, local, descricao, aviso, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.titulo, data.data, data.hora, data.cidade, data.local, data.descricao, 
      data.aviso ? 1 : 0, data.status || 'pendente'
    );
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/agendas/:id", (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const stmt = db.prepare(`
      UPDATE agendas SET 
        titulo = ?, data = ?, hora = ?, cidade = ?, local = ?, 
        descricao = ?, aviso = ?, status = ?
      WHERE id = ?
    `);
    stmt.run(
      data.titulo, data.data, data.hora, data.cidade, data.local, 
      data.descricao, data.aviso ? 1 : 0, data.status, id
    );
    res.json({ success: true });
  });

  app.delete("/api/agendas/:id", (req, res) => {
    db.prepare("DELETE FROM agendas WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
