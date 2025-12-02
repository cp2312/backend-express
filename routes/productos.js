import express from "express";
import pool from "../db.js";
const router = express.Router();

// Crear producto
router.post("/", async (req, res) => {
  const { nombre, precio_unitario, libras, gasto, semana_id } = req.body;
  try {
    const q = await pool.query(
      `INSERT INTO productos (nombre, precio_unitario, libras, gasto, semana_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [nombre, precio_unitario, libras, gasto || 0, semana_id]
    );
    res.json(q.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando producto" });
  }
});

// Listar productos por semana
router.get("/semana/:id", async (req, res) => {
  try {
    const q = await pool.query("SELECT * FROM productos WHERE semana_id=$1 ORDER BY id", [req.params.id]);
    res.json(q.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando productos" });
  }
});

// Actualizar producto
router.put("/:id", async (req, res) => {
  const { nombre, precio_unitario, libras, gasto } = req.body;
  try {
    const q = await pool.query(
      `UPDATE productos SET nombre=$1, precio_unitario=$2, libras=$3, gasto=$4 WHERE id=$5 RETURNING *`,
      [nombre, precio_unitario, libras, gasto || 0, req.params.id]
    );
    res.json(q.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando producto" });
  }
});

// Borrar producto
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM productos WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error borrando producto" });
  }
});

export default router;
