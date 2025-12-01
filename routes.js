import express from "express";
import { db } from "./db.js";

const router = express.Router();

// Obtener todos los usuarios
router.get("/users", async (req, res) => {
  const result = await db.query("SELECT * FROM users");
  res.json(result.rows);
});

// Crear usuario
router.post("/users", async (req, res) => {
  const { name } = req.body;
  const result = await db.query(
    "INSERT INTO users (name) VALUES ($1) RETURNING *",
    [name]
  );
  res.json(result.rows[0]);
});

export default router;
