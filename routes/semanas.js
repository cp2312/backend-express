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
