import express from "express";
import pool from "../db.js";
const router = express.Router();

// crear
router.post("/", async (req, res) => {
  const { persona, monto, concepto, tipo, semana_id } = req.body;
  try {
    const q = await pool.query(
      `INSERT INTO prestamos (persona,monto,concepto,tipo,semana_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [persona, monto, concepto, tipo, semana_id]
    );
    res.json(q.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando prestamo" });
  }
});

// listar por semana
router.get("/semana/:id", async (req, res) => {
  try {
    const q = await pool.query("SELECT * FROM prestamos WHERE semana_id=$1 ORDER BY id", [req.params.id]);
    res.json(q.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando prestamos" });
  }
});

export default router;
