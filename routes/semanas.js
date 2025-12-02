import express from "express";
import pool from "../db.js";
const router = express.Router();

// CRUD semanas
router.post("/", async (req, res) => {
  const { fecha, nombre_semana, mes } = req.body;
  try {
    const q = await pool.query(
      "INSERT INTO semanas (fecha, nombre_semana, mes) VALUES ($1,$2,$3) RETURNING *",
      [fecha, nombre_semana, mes]
    );
    res.json(q.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando semana" });
  }
});

router.get("/", async (req, res) => {
  try {
    const q = await pool.query("SELECT * FROM semanas ORDER BY fecha DESC");
    res.json(q.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando semanas" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const q = await pool.query("SELECT * FROM semanas WHERE id=$1", [req.params.id]);
    res.json(q.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo semana" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM semanas WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error borrando semana" });
  }
});

export default router;



// En tu routes/semanas.js, agrega estos endpoints:

// Obtener la semana activa actual
router.get("/activa", async (req, res) => {
  try {
    const q = await pool.query("SELECT * FROM semanas WHERE activa = TRUE LIMIT 1");
    if (q.rows.length > 0) {
      res.json(q.rows[0]);
    } else {
      res.status(404).json({ error: "No hay semana activa" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo semana activa" });
  }
});

// Al crear una nueva semana, desactivar las anteriores y activar la nueva
router.post("/", async (req, res) => {
  const { fecha, nombre_semana, mes } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Desactivar todas las semanas
    await client.query("UPDATE semanas SET activa = FALSE WHERE activa = TRUE");
    
    // 2. Crear nueva semana activa
    const q = await client.query(
      `INSERT INTO semanas (fecha, nombre_semana, mes, activa)
       VALUES ($1, $2, $3, TRUE) RETURNING *`,
      [fecha, nombre_semana, mes]
    );
    
    await client.query('COMMIT');
    res.json(q.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Error creando semana" });
  } finally {
    client.release();
  }
});

// Endpoint para reiniciar semana (desactivar todas)
router.post("/reiniciar", async (req, res) => {
  try {
    await pool.query("UPDATE semanas SET activa = FALSE WHERE activa = TRUE");
    res.json({ ok: true, message: "Semana reiniciada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error reiniciando semana" });
  }
});