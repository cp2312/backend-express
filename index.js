import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import semanasRouter from "./routes/semanas.js";
import productosRouter from "./routes/productos.js";
import prestamosRouter from "./routes/prestamos.js";
import pagosRouter from "./routes/pagos.js";
import cierresRouter from "./routes/cierres_caja.js";
import otrosRouter from "./routes/otros_gastos.js";

const app = express();
app.use(cors());
app.use(express.json());

// prefijo API
app.use("/api/semanas", semanasRouter);
app.use("/api/productos", productosRouter);
app.use("/api/prestamos", prestamosRouter);
app.use("/api/pagos", pagosRouter);
app.use("/api/cierres", cierresRouter);
app.use("/api/otros", otrosRouter);

// resumen por semana
app.get("/api/semana/:id/summary", async (req, res) => {
  const pool = (await import("./db.js")).default;
  const { id } = req.params;
  try {
    const prod = await pool.query(
      `SELECT COALESCE(SUM(total_final),0) AS productos_total FROM productos WHERE semana_id=$1`,
      [id]
    );

    const prestamos = await pool.query(
      `SELECT COALESCE(SUM(monto),0) AS prestamos_total FROM prestamos WHERE semana_id=$1 AND tipo='Gasto'`,
      [id]
    );

    const pagos = await pool.query(
      `SELECT COALESCE(SUM(monto),0) AS pagos_total FROM pagos WHERE semana_id=$1`,
      [id]
    );

    const otros = await pool.query(
      `SELECT COALESCE(SUM(monto),0) AS otros_total FROM otros_gastos WHERE semana_id=$1`,
      [id]
    );

    const ventasRow = await pool.query(
      `SELECT COALESCE(SUM(ventas),0) as ventas_total FROM cierres_caja WHERE semana_id=$1`,
      [id]
    );

    const productos_total = Number(prod.rows[0].productos_total);
    const prestamos_total = Number(prestamos.rows[0].prestamos_total);
    const pagos_total = Number(pagos.rows[0].pagos_total);
    const otros_total = Number(otros.rows[0].otros_total);
    const ventas_total = Number(ventasRow.rows[0].ventas_total);

    // total gastos = prestamos_total + pagos_total + otros_total
    const total_gastos = prestamos_total + pagos_total + otros_total;

    // neto (lo que queda) = productos_total - total_gastos
    const neto = productos_total - total_gastos;

    res.json({
      productos_total,
      prestamos_total,
      pagos_total,
      otros_total,
      total_gastos,
      ventas_total,
      neto
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo resumen" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server listening on port", PORT));
