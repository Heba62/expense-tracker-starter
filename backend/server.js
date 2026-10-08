// Expense Tracker - backend (Express API + PostgreSQL)
//
// PHASE 1
// Setup:
//   1. Create a database named expense_tracker and run schema.sql on it.
//   2. Copy .env.example to a new file named .env and write your PostgreSQL password.
//   3. npm install express cors pg dotenv
// Run:    node server.js   (restart it every time you change this file)
//
// Endpoints you need to build:
//   GET    /api/expenses        return all expenses
//   GET    /api/expenses/:id    return one expense (404 if not found)
//   POST   /api/expenses        add an expense (201, or 400 if the data is invalid)
//   PUT    /api/expenses/:id    update an expense (200, 400, or 404)
//   DELETE /api/expenses/:id    delete an expense (200, or 404)
//
// Tips:
//   - Create one Pool (from the "pg" library) with the values from .env,
//     and use pool.query(...) in every route.
//   - ALWAYS send the values as parameters: pool.query("... WHERE id = $1", [id]).
//     NEVER build the SQL text by joining strings with data from the user.
//   - Use RETURNING to get the new (or updated) row back from INSERT and UPDATE.
//   - The database creates the id. The client never sends one.
//   - pg returns NUMERIC as text and DATE as a JavaScript Date, so fix both in your SELECT.
//     Hint: amount::float8 and to_char(date, 'YYYY-MM-DD').
//   - Validate the data before the query, and answer 400 with a message that explains the problem.
//   - Check the id before the query. A text like "abc" makes PostgreSQL throw an error.
//   - Enable CORS so the frontend can talk to the server.
//   - Test every endpoint with Thunder Client BEFORE you connect the frontend.

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.get("/api/expenses", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, amount::float8, category, to_char(date, 'DD-MM-YYYY') as date FROM expenses ORDER BY id ASC",
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/expenses/:id", async (req, res) => {
  const expenseId = req.params.id;

  if (isNaN(expenseId) || expenseId <= 0) {
    return res
      .status(400)
      .json({ error: "Invalid ID format. Must be a number." });
  }

  try {
    const result = await pool.query(
      "SELECT id, title, amount::float8, category, to_char(date, 'DD-MM-YYYY') as date FROM expenses WHERE id = $1",
      [expenseId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/expenses", async (req, res) => {
  const { title, amount, category, date } = req.body;

  if (!title || amount === undefined || isNaN(amount) || !category) {
    return res
      .status(400)
      .json({ error: "Title, valid amount, and category are required." });
  }

  try {
    const expenseDate = date || new Date().toISOString().split("T")[0];

    const result = await pool.query(
      "INSERT INTO expenses (title, amount, category, date) VALUES ($1, $2, $3, $4) RETURNING id, title, amount::float8, category, to_char(date, 'DD-MM-YYYY') as date",
      [title, amount, category, expenseDate],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal Server Error or Invalid Category value" });
  }
});

app.put("/api/expenses/:id", async (req, res) => {
  const expenseId = req.params.id;
  const { title, amount, category, date } = req.body;

  if (isNaN(expenseId)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  if (!title || amount === undefined || isNaN(amount) || !category) {
    return res.status(400).json({
      error: "Title, valid amount, and category are required for update",
    });
  }

  try {
    const expenseDate = date || new Date().toISOString().split("T")[0];

    const result = await pool.query(
      `UPDATE expenses 
       SET title = $1, amount = $2, category = $3, date = $4 
       WHERE id = $5 
       RETURNING id, title, amount::float8, category, to_char(date, 'DD-MM-YYYY') as date`,
      [title, amount, category, expenseDate, expenseId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal Server Error or Invalid Category value" });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  const expenseId = req.params.id;

  if (isNaN(expenseId)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM expenses WHERE id = $1 RETURNING id, title, amount::float8, category, to_char(date, 'DD-MM-YYYY') as date",
      [expenseId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(200).json({
      message: "Expense deleted successfully",
      deleted: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use((req, res) => {
  res
    .status(404)
    .json({ error: "Not Found", message: "Route does not exist." });
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

