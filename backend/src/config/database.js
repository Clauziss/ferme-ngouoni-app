require("dotenv").config();
const { Sequelize } = require("sequelize");

// Sur Render (ou tout hébergeur type Heroku/Railway), DATABASE_URL fournit
// tout en une seule chaîne de connexion. En local, on continue à utiliser
// les variables séparées (DB_HOST, DB_USER, etc.) du fichier .env.
//
// Le SSL n'est forcé que sur l'URL "externe" (hostname en .render.com) —
// l'URL interne (nom court, réseau privé Render) ne le supporte pas toujours
// et forcer SSL dessus peut faire échouer la connexion.
function construireSequelize() {
  if (!process.env.DATABASE_URL) {
    return new Sequelize(
      process.env.DB_NAME || "ferme_avicole",
      process.env.DB_USER || "postgres",
      process.env.DB_PASSWORD || "postgres",
      {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        dialect: "postgres",
        logging: false,
      }
    );
  }

  const url = new URL(process.env.DATABASE_URL);
  const estExterne = url.hostname.includes("render.com");

  return new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: estExterne
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  });
}

const sequelize = construireSequelize();

module.exports = sequelize;
