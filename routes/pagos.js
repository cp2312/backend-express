import express from "express";
import pool from "../db.js";
const router = express.Router();

router.post("/", async (req, res) => {
  const { concepto, monto, destinatario, fecha, semana_id } = req.body;
  try {
    const q = await pool.query(
      `INSERT INTO pagos (concepto,monto,destinatario,fecha,semana_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [concepto, monto, destinatario, fecha, semana_id]
    );
    res.json(q.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando pago" });
  }
});

router.get("/semana/:id", async (req, res) => {
  try {
    const q = await pool.query("SELECT * FROM pagos WHERE semana_id=$1 ORDER BY id", [req.params.id]);
    res.json(q.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando pagos" });
  }
});

export default router;
