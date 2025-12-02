import express from "express";
import pool from "../db.js";
const router = express.Router();

router.post("/", async (req, res) => {
  const { dia, total_efectivo, base, ventas, talonarios, semana_id } = req.body;
  try {
    // calcular diferencia en backend
    const diferencia = Number(total_efectivo) + Number(talonarios) - Number(ventas) - Number(base);
    const q = await pool.query(
      `INSERT INTO cierres_caja (dia,total_efectivo,base,ventas,talonarios,diferencia,semana_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [dia, total_efectivo, base, ventas, talonarios, diferencia, semana_id]
    );
    res.json(q.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando cierre" });
  }
});

router.get("/semana/:id", async (req, res) => {
  try {
    const q = await pool.query("SELECT * FROM cierres_caja WHERE semana_id=$1 ORDER BY id", [req.params.id]);
    res.json(q.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando cierres" });
  }
});

export default router;
