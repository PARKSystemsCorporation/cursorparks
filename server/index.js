"use strict";

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { getDb, initSchema } = require("./db");
const routes = require("./routes");

initSchema(getDb());

const app = express();
const port = parseInt(process.env.PORT, 10) || 4000;

app.use(cors());
app.use(express.json({ limit: "512kb" }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
  });
  next();
});

app.use("/", routes);

app.use((req, res) => {
  res.status(404).json({ error: "not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal error" });
});

app.listen(port, () => {
  console.log(`PARKS Bazaar API listening on port ${port}`);
});
