import express from "express";
import pool from "../db.js";
const router = express.Router();

// Crear un nuevo gasto
router.post("/", async (req, res) => {
  const { fecha, concepto, monto, semana_id } = req.body;
  try {
    const q = await pool.query(
      `INSERT INTO otros_gastos (fecha, concepto, monto, semana_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [fecha, concepto, monto, semana_id]
    );
    res.json(q.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando gasto" });
  }
});

// Obtener todos los gastos de una semana
router.get("/semana/:id", async (req, res) => {
  try {
    const q = await pool.query(
      "SELECT * FROM otros_gastos WHERE semana_id=$1 ORDER BY fecha DESC, id DESC",
      [req.params.id]
    );
    res.json(q.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando otros gastos" });
  }
});

// Obtener un gasto específico
router.get("/:id", async (req, res) => {
  try {
    const q = await pool.query(
      "SELECT * FROM otros_gastos WHERE id=$1",
      [req.params.id]
    );
    
    if (q.rows.length === 0) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }
    
    res.json(q.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo gasto" });
  }
});

// Actualizar un gasto
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { fecha, concepto, monto, semana_id } = req.body;
  
  try {
    const q = await pool.query(
      `UPDATE otros_gastos 
       SET fecha=$1, concepto=$2, monto=$3, semana_id=$4
       WHERE id=$5 
       RETURNING *`,
      [fecha, concepto, monto, semana_id, id]
    );
    
    if (q.rows.length === 0) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }
    
    res.json(q.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando gasto" });
  }
});

// Eliminar un gasto
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const q = await pool.query(
      "DELETE FROM otros_gastos WHERE id=$1 RETURNING *",
      [id]
    );
    
    if (q.rows.length === 0) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }
    
    res.json({ 
      message: "Gasto eliminado correctamente",
      gasto: q.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando gasto" });
  }
});

export default router;