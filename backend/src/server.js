require("dotenv").config();
const app = require("./app");
const sequelize = require("./config/database");
require("./models"); // charge les associations
const demarrerRappelsCron = require("./jobs/reminderCron");

const PORT = process.env.PORT || 4000;

async function demarrer() {
  console.log("DATABASE_URL présente :", process.env.DATABASE_URL ? "oui" : "NON — variable absente !");
  if (process.env.DATABASE_URL) {
    try {
      const u = new URL(process.env.DATABASE_URL);
      console.log("Hôte cible :", JSON.stringify(u.hostname));
      console.log("Port cible :", JSON.stringify(u.port));
      console.log("Base cible :", JSON.stringify(u.pathname));
      console.log("Utilisateur :", JSON.stringify(u.username));
      console.log("Longueur totale de l'URL :", process.env.DATABASE_URL.length);
    } catch (e) {
      console.log("!! L'URL fournie n'est pas valide :", e.message);
    }
  }
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // en dev : crée/ajuste les tables automatiquement
    console.log("Connexion à la base de données établie.");
    demarrerRappelsCron();
    app.listen(PORT, () => console.log(`API en écoute sur http://localhost:${PORT}`));
  } catch (err) {
    console.error("=== ERREUR AU DEMARRAGE ===");
    console.error("Nom :", err.name);
    console.error("Message :", err.message);
    console.error("Détail complet :", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    console.error("===========================");
    process.exit(1);
  }
}

demarrer();
