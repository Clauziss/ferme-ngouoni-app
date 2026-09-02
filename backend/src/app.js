require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/sante", (req, res) => res.json({ statut: "ok" }));
app.use("/api", routes);

app.use((req, res) => res.status(404).json({ erreur: "Route inconnue." }));
// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erreur: "Erreur serveur." });
});

module.exports = app;
