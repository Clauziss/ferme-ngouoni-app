const sequelize = require("../config/database");
const Utilisateur = require("./Utilisateur");
const Lot = require("./Lot");
const ProductionOeuf = require("./ProductionOeuf");
const ProductionChair = require("./ProductionChair");
const Reproduction = require("./Reproduction");
const Depense = require("./Depense");
const Vente = require("./Vente");
const Abonne = require("./Abonne");
const Rappel = require("./Rappel");

// --- Associations ---
// Production œufs, Suivi de masse, Dépenses et Ventes ne se rattachent plus
// au Cheptel (Lot) : ils portent leur propre champ "sujet"/"type" simple.

Lot.hasMany(Reproduction, { foreignKey: "lotGeniteurId", onDelete: "SET NULL" });
Reproduction.belongsTo(Lot, { as: "lotGeniteur", foreignKey: "lotGeniteurId" });
Reproduction.belongsTo(Lot, { as: "lotDescendance", foreignKey: "lotDescendanceId" });

Abonne.hasMany(Vente, { foreignKey: "clientId", onDelete: "SET NULL" });
Vente.belongsTo(Abonne, { as: "client", foreignKey: "clientId" });

// Les rappels (ex: vaccination) peuvent toujours cibler une entrée du Cheptel.
// Les rappels (ex: vaccination) peuvent cibler une entrée du Cheptel,
// ou une vente non soldée (rappel de paiement).
Lot.hasMany(Rappel, { foreignKey: "lotId", onDelete: "CASCADE" });
Rappel.belongsTo(Lot, { foreignKey: "lotId" });
Vente.hasMany(Rappel, { foreignKey: "venteId", onDelete: "CASCADE" });
Rappel.belongsTo(Vente, { foreignKey: "venteId" });
Utilisateur.hasMany(Rappel, { foreignKey: "creePar", onDelete: "SET NULL" });
Rappel.belongsTo(Utilisateur, { as: "auteur", foreignKey: "creePar" });

module.exports = {
  sequelize,
  Utilisateur,
  Lot,
  ProductionOeuf,
  ProductionChair,
  Reproduction,
  Depense,
  Vente,
  Abonne,
  Rappel,
};
