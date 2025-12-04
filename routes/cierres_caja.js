import express from "express";
import pool from "../db.js";
const router = express.Router();

// POST - Crear nuevo cierre de caja
router.post("/", async (req, res) => {
  const { 
    dia, 
    total_efectivo, 
    base, 
    ventas, 
    talonarios, 
    semana_id,
    llevar,
    otro,
    numero_caja,
    prestamos,
    prestamos_total,
    observaciones
  } = req.body;
  
  try {
    // Calcular diferencia correctamente según la fórmula:
    // Diferencia = (Total Efectivo + Total Préstamos) - (BASE + VENTAS + TALONARIOS + LLEVAR + OTRO)
    const totalConceptos = Number(base) + Number(ventas) + Number(talonarios) + 
                          (Number(llevar) || 0) + (Number(otro) || 0);
    const totalPrestamos = Number(prestamos_total) || 0;
    const diferencia = (Number(total_efectivo) + totalPrestamos) - totalConceptos;
    
    // Convertir prestamos a JSON si viene como array
    let prestamosJSON = '[]';
    if (prestamos && Array.isArray(prestamos)) {
      prestamosJSON = JSON.stringify(prestamos);
    } else if (typeof prestamos === 'string') {
      prestamosJSON = prestamos;
    }
    
    const query = await pool.query(
      `INSERT INTO cierres_caja (
        dia, total_efectivo, base, ventas, talonarios, diferencia, semana_id,
        llevar, otro, numero_caja, prestamos, prestamos_total, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        dia, 
        total_efectivo, 
        base, 
        ventas, 
        talonarios, 
        diferencia, 
        semana_id,
        llevar || 0,
        otro || 0,
        numero_caja || 1,
        prestamosJSON,
        totalPrestamos,
        observaciones || null
      ]
    );
    
    res.json(query.rows[0]);
  } catch (err) {
    console.error("Error creando cierre:", err);
    res.status(500).json({ error: "Error creando cierre de caja" });
  }
});

// PUT - Actualizar cierre existente
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { 
    dia, 
    total_efectivo, 
    base, 
    ventas, 
    talonarios, 
    semana_id,
    llevar,
    otro,
    numero_caja,
    prestamos,
    prestamos_total,
    observaciones
  } = req.body;
  
  try {
    // Calcular diferencia
    const totalConceptos = Number(base) + Number(ventas) + Number(talonarios) + 
                          (Number(llevar) || 0) + (Number(otro) || 0);
    const totalPrestamos = Number(prestamos_total) || 0;
    const diferencia = (Number(total_efectivo) + totalPrestamos) - totalConceptos;
    
    // Convertir prestamos a JSON si viene como array
    let prestamosJSON = '[]';
    if (prestamos && Array.isArray(prestamos)) {
      prestamosJSON = JSON.stringify(prestamos);
    } else if (typeof prestamos === 'string') {
      prestamosJSON = prestamos;
    }
    
    const query = await pool.query(
      `UPDATE cierres_caja SET 
        dia = $1, 
        total_efectivo = $2, 
        base = $3, 
        ventas = $4, 
        talonarios = $5, 
        diferencia = $6, 
        semana_id = $7,
        llevar = $8,
        otro = $9,
        numero_caja = $10,
        prestamos = $11,
        prestamos_total = $12,
        observaciones = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14 RETURNING *`,
      [
        dia, 
        total_efectivo, 
        base, 
        ventas, 
        talonarios, 
        diferencia, 
        semana_id,
        llevar || 0,
        otro || 0,
        numero_caja || 1,
        prestamosJSON,
        totalPrestamos,
        observaciones || null,
        id
      ]
    );
    
    if (query.rows.length === 0) {
      return res.status(404).json({ error: "Cierre no encontrado" });
    }
    
    res.json(query.rows[0]);
  } catch (err) {
    console.error("Error actualizando cierre:", err);
    res.status(500).json({ error: "Error actualizando cierre de caja" });
  }
});

// GET - Obtener todos los cierres de una semana específica
router.get("/semana/:id", async (req, res) => {
  try {
    const query = await pool.query(
      "SELECT * FROM cierres_caja WHERE semana_id = $1 ORDER BY dia, numero_caja",
      [req.params.id]
    );
    
    // Parsear el campo prestamos si es JSON
    const cierres = query.rows.map(cierre => {
      if (cierre.prestamos && typeof cierre.prestamos === 'string') {
        try {
          cierre.prestamos = JSON.parse(cierre.prestamos);
        } catch (e) {
          cierre.prestamos = [];
        }
      }
      return cierre;
    });
    
    res.json(cierres);
  } catch (err) {
    console.error("Error listando cierres:", err);
    res.status(500).json({ error: "Error listando cierres de caja" });
  }
});

// GET - Obtener un cierre específico por ID
router.get("/:id", async (req, res) => {
  try {
    const query = await pool.query(
      "SELECT * FROM cierres_caja WHERE id = $1",
      [req.params.id]
    );
    
    if (query.rows.length === 0) {
      return res.status(404).json({ error: "Cierre no encontrado" });
    }
    
    // Parsear el campo prestamos si es JSON
    const cierre = query.rows[0];
    if (cierre.prestamos && typeof cierre.prestamos === 'string') {
      try {
        cierre.prestamos = JSON.parse(cierre.prestamos);
      } catch (e) {
        cierre.prestamos = [];
      }
    }
    
    res.json(cierre);
  } catch (err) {
    console.error("Error obteniendo cierre:", err);
    res.status(500).json({ error: "Error obteniendo cierre de caja" });
  }
});

// DELETE - Eliminar un cierre
router.delete("/:id", async (req, res) => {
  try {
    const query = await pool.query(
      "DELETE FROM cierres_caja WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    
    if (query.rows.length === 0) {
      return res.status(404).json({ error: "Cierre no encontrado" });
    }
    
    res.json({ message: "Cierre eliminado correctamente", cierre: query.rows[0] });
  } catch (err) {
    console.error("Error eliminando cierre:", err);
    res.status(500).json({ error: "Error eliminando cierre de caja" });
  }
});

// GET - Obtener cierres por día y número de caja (útil para verificar duplicados)
router.get("/buscar/:semana_id/:dia/:numero_caja", async (req, res) => {
  const { semana_id, dia, numero_caja } = req.params;
  
  try {
    const query = await pool.query(
      "SELECT * FROM cierres_caja WHERE semana_id = $1 AND dia = $2 AND numero_caja = $3",
      [semana_id, dia, numero_caja]
    );
    
    // Parsear el campo prestamos si es JSON
    const cierres = query.rows.map(cierre => {
      if (cierre.prestamos && typeof cierre.prestamos === 'string') {
        try {
          cierre.prestamos = JSON.parse(cierre.prestamos);
        } catch (e) {
          cierre.prestamos = [];
        }
      }
      return cierre;
    });
    
    res.json(cierres);
  } catch (err) {
    console.error("Error buscando cierres:", err);
    res.status(500).json({ error: "Error buscando cierres de caja" });
  }
});

// GET - Resumen de cierres por semana (totales por día)
router.get("/resumen/semana/:id", async (req, res) => {
  try {
    const query = await pool.query(
      `SELECT 
        dia,
        COUNT(*) as total_cajas,
        SUM(total_efectivo) as total_efectivo,
        SUM(prestamos_total) as total_prestamos,
        SUM(diferencia) as total_diferencia,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', id,
            'numero_caja', numero_caja,
            'total_efectivo', total_efectivo,
            'diferencia', diferencia,
            'prestamos_total', prestamos_total
          )
        ) as cajas_detalle
      FROM cierres_caja 
      WHERE semana_id = $1
      GROUP BY dia
      ORDER BY 
        CASE dia
          WHEN 'Sábado' THEN 1
          WHEN 'Domingo' THEN 2
          WHEN 'Lunes' THEN 3
          ELSE 4
        END`,
      [req.params.id]
    );
    
    res.json(query.rows);
  } catch (err) {
    console.error("Error generando resumen:", err);
    res.status(500).json({ error: "Error generando resumen de cierres" });
  }
});

export default router;