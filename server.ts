import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Conexão com MySQL Remoto ────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "sisrenilcenene",
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            "utf8mb4",
  timezone:           "local",
});

// Testa conexão na inicialização
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Conectado ao MySQL remoto com sucesso!");
    conn.release();
  } catch (err: any) {
    console.error("❌ Falha ao conectar ao MySQL:", err.message);
    process.exit(1);
  }
}

// Helper: executa query e retorna rows
async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

// Helper: executa INSERT/UPDATE/DELETE e retorna result
async function execute(sql: string, params: any[] = []) {
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

// ─── Seed: cria admin padrão caso não exista ─────────────────────────────────
async function seedAdmin() {
  const rows = await query("SELECT id FROM usuarios WHERE email = ?", ["admin@campanha.com"]);
  if (rows.length === 0) {
    // Em produção, use um hash bcrypt real para a senha
    await execute(
      "INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)",
      ["Administrador", "admin@campanha.com", "admin123", "Administrador"]
    );
    console.log("ℹ️  Usuário admin criado (admin@campanha.com / admin123). Troque a senha!");
  }
}

// ─── Servidor ────────────────────────────────────────────────────────────────
async function startServer() {
  await testConnection();
  await seedAdmin();

  const app = express();
  app.use(express.json());

  // ── API: Stats (Dashboard) ───────────────────────────────────────────────
  app.get("/api/stats", async (_req, res) => {
    try {
      const [totalRow]       = await query<any>("SELECT COUNT(*) as count FROM liderancas");
      const [foraIgrejaRow]  = await query<any>("SELECT COUNT(*) as count FROM liderancas WHERE grupo = 'Fora da Igreja'");
      const [igrejaRow]      = await query<any>("SELECT COUNT(*) as count FROM liderancas WHERE grupo = 'Igreja / Pastores'");
      const [votosNeneRow]   = await query<any>("SELECT COALESCE(SUM(votos_nene), 0) as soma FROM liderancas");
      const [votosRenilceRow]= await query<any>("SELECT COALESCE(SUM(votos_renilce), 0) as soma FROM liderancas");

      const rankingCidades = await query<any>(`
        SELECT cidade, SUM(votos_nene + votos_renilce) AS total_votos
        FROM liderancas
        GROUP BY cidade
        ORDER BY total_votos DESC
        LIMIT 5
      `);

      const rankingBairros = await query<any>(`
        SELECT bairro, SUM(votos_nene + votos_renilce) AS total_votos
        FROM liderancas
        GROUP BY bairro
        ORDER BY total_votos DESC
        LIMIT 5
      `);

      res.json({
        total:         totalRow.count,
        foraIgreja:    foraIgrejaRow.count,
        igreja:        igrejaRow.count,
        votosNene:     votosNeneRow.soma,
        votosRenilce:  votosRenilceRow.soma,
        rankingCidades,
        rankingBairros,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── API: Lideranças ──────────────────────────────────────────────────────
  app.get("/api/liderancas", async (req, res) => {
    try {
      const { search, grupo, cidade, situacao } = req.query;
      let sql    = "SELECT * FROM liderancas WHERE 1=1";
      const params: any[] = [];

      if (search) {
        sql += " AND (nome_lideranca LIKE ? OR fone_zap LIKE ? OR cidade LIKE ? OR bairro LIKE ?)";
        const s = `%${search}%`;
        params.push(s, s, s, s);
      }
      if (grupo)   { sql += " AND grupo = ?";   params.push(grupo); }
      if (cidade)  { sql += " AND cidade = ?";  params.push(cidade); }
      if (situacao){ sql += " AND situacao = ?"; params.push(situacao); }

      sql += " ORDER BY data_atualizacao DESC";
      const rows = await query(sql, params);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/liderancas/:id", async (req, res) => {
    try {
      const [row] = await query("SELECT * FROM liderancas WHERE id = ?", [req.params.id]);
      row ? res.json(row) : res.status(404).json({ error: "Não encontrado" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/liderancas", async (req, res) => {
    try {
      const d = req.body;
      const result = await execute(`
        INSERT INTO liderancas (
          grupo, nome_lideranca, data_aniversario, fone_zap, cidade, bairro,
          indicacao, acompanhado_por, situacao, demanda_recebida, compromisso_politico,
          percentual_votos_municipio, ultima_visita, votos_nene, votos_renilce,
          observacoes, responsavel_cadastro, proxima_visita, prioridade
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        d.grupo, d.nome_lideranca, d.data_aniversario || null, d.fone_zap,
        d.cidade, d.bairro, d.indicacao, d.acompanhado_por, d.situacao,
        d.demanda_recebida, d.compromisso_politico, d.percentual_votos_municipio || 0,
        d.ultima_visita || null, d.votos_nene || 0, d.votos_renilce || 0,
        d.observacoes, d.responsavel_cadastro, d.proxima_visita || null, d.prioridade,
      ]);
      res.json({ id: result.insertId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/liderancas/:id", async (req, res) => {
    try {
      const d = req.body;
      await execute(`
        UPDATE liderancas SET
          grupo = ?, nome_lideranca = ?, data_aniversario = ?, fone_zap = ?,
          cidade = ?, bairro = ?, indicacao = ?, acompanhado_por = ?,
          situacao = ?, demanda_recebida = ?, compromisso_politico = ?,
          percentual_votos_municipio = ?, ultima_visita = ?, votos_nene = ?,
          votos_renilce = ?, observacoes = ?, proxima_visita = ?, prioridade = ?,
          data_atualizacao = NOW()
        WHERE id = ?
      `, [
        d.grupo, d.nome_lideranca, d.data_aniversario || null, d.fone_zap,
        d.cidade, d.bairro, d.indicacao, d.acompanhado_por, d.situacao,
        d.demanda_recebida, d.compromisso_politico, d.percentual_votos_municipio || 0,
        d.ultima_visita || null, d.votos_nene || 0, d.votos_renilce || 0,
        d.observacoes, d.proxima_visita || null, d.prioridade,
        req.params.id,
      ]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── API: Visitas ─────────────────────────────────────────────────────────
  app.get("/api/liderancas/:id/visitas", async (req, res) => {
    try {
      const rows = await query(
        "SELECT * FROM visitas WHERE lideranca_id = ? ORDER BY data_visita DESC",
        [req.params.id]
      );
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/liderancas/:id/visitas", async (req, res) => {
    try {
      const { data_visita, relato, responsavel } = req.body;
      await execute(
        "INSERT INTO visitas (lideranca_id, data_visita, relato, responsavel) VALUES (?,?,?,?)",
        [req.params.id, data_visita, relato, responsavel]
      );
      await execute(
        "UPDATE liderancas SET ultima_visita = ? WHERE id = ?",
        [data_visita, req.params.id]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── API: Demandas ────────────────────────────────────────────────────────
  app.get("/api/liderancas/:id/demandas", async (req, res) => {
    try {
      const rows = await query(
        "SELECT * FROM demandas WHERE lideranca_id = ? ORDER BY data_abertura DESC",
        [req.params.id]
      );
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/liderancas/:id/demandas", async (req, res) => {
    try {
      await execute(
        "INSERT INTO demandas (lideranca_id, descricao) VALUES (?,?)",
        [req.params.id, req.body.descricao]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── API: Agendas ─────────────────────────────────────────────────────────
  app.get("/api/agendas", async (_req, res) => {
    try {
      const rows = await query("SELECT * FROM agendas ORDER BY data ASC, hora ASC");
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/agendas", async (req, res) => {
    try {
      const d = req.body;
      const result = await execute(
        "INSERT INTO agendas (titulo, data, hora, cidade, local, descricao, aviso, status) VALUES (?,?,?,?,?,?,?,?)",
        [d.titulo, d.data, d.hora || null, d.cidade, d.local, d.descricao, d.aviso ? 1 : 0, d.status || "pendente"]
      );
      res.json({ id: result.insertId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/agendas/:id", async (req, res) => {
    try {
      const d = req.body;
      await execute(
        "UPDATE agendas SET titulo=?, data=?, hora=?, cidade=?, local=?, descricao=?, aviso=?, status=? WHERE id=?",
        [d.titulo, d.data, d.hora || null, d.cidade, d.local, d.descricao, d.aviso ? 1 : 0, d.status, req.params.id]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/agendas/:id", async (req, res) => {
    try {
      await execute("DELETE FROM agendas WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Vite / Static ────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
