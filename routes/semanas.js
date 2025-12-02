import express from "express";
import pool from "../db.js";
const router = express.Router();

// CRUD semanas

// 1. Obtener todas las semanas
router.get("/", async (req, res) => {
  try {
    const q = await pool.query("SELECT * FROM semanas ORDER BY fecha DESC");
    res.json(q.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando semanas" });
  }
});

// 2. Obtener semana por ID
router.get("/:id", async (req, res) => {
  try {
    const q = await pool.query("SELECT * FROM semanas WHERE id=$1", [req.params.id]);
    if (q.rows.length > 0) {
      res.json(q.rows[0]);
    } else {
      res.status(404).json({ error: "Semana no encontrada" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo semana" });
  }
});

// 3. Obtener la semana activa actual
router.get("/activa/actual", async (req, res) => {
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

// 4. Crear nueva semana (y desactivar las anteriores)
router.post("/", async (req, res) => {
  const { fecha, nombre_semana, mes } = req.body;
  
  // Verificar que la fecha no exista ya
  try {
    const checkQuery = await pool.query(
      "SELECT * FROM semanas WHERE fecha = $1",
      [fecha]
    );
    
    if (checkQuery.rows.length > 0) {
      return res.status(400).json({ 
        error: "Ya existe una semana con esta fecha" 
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error verificando fecha" });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Desactivar todas las semanas anteriores
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

// 5. Reiniciar semana (desactivar todas)
router.post("/reiniciar", async (req, res) => {
  try {
    await pool.query("UPDATE semanas SET activa = FALSE WHERE activa = TRUE");
    res.json({ 
      ok: true, 
      message: "Semana reiniciada correctamente",
      semanas_desactivadas: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error reiniciando semana" });
  }
});

// 6. Eliminar semana por ID
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM semanas WHERE id=$1", [req.params.id]);
    res.json({ 
      ok: true, 
      message: "Semana eliminada correctamente" 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error borrando semana" });
  }
});

// 7. Actualizar semana (opcional)
router.put("/:id", async (req, res) => {
  const { fecha, nombre_semana, mes, activa } = req.body;
  
  try {
    const q = await pool.query(
      `UPDATE semanas 
       SET fecha=$1, nombre_semana=$2, mes=$3, activa=$4 
       WHERE id=$5 
       RETURNING *`,
      [fecha, nombre_semana, mes, activa || false, req.params.id]
    );
    
    if (q.rows.length > 0) {
      res.json(q.rows[0]);
    } else {
      res.status(404).json({ error: "Semana no encontrada" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando semana" });
  }
});

export default router;