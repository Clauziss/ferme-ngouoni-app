const sequelize = require("../config/database");
const Utilisateur = require("./Utilisateur");
const Lot = require("./Lot");
const ProductionOeuf = require("./ProductionOeuf");
const ProductionChair = require("./ProductionChair");
const Reproduction = require("./Reproduction");
const Depense = require("./Depense");
const Vente = require("./Vente");
const Paiement = require("./Paiement");
const Abonne = require("./Abonne");
const Rappel = require("./Rappel");
const Vaccination = require("./Vaccination");

// --- Associations ---
// Production œufs, Suivi de masse, Dépenses et Ventes ne se rattachent plus
// au Cheptel (Lot) : ils portent leur propre champ "sujet"/"type" simple.

Lot.hasMany(Reproduction, { foreignKey: "lotGeniteurId", onDelete: "SET NULL" });
Reproduction.belongsTo(Lot, { as: "lotGeniteur", foreignKey: "lotGeniteurId" });
Reproduction.belongsTo(Lot, { as: "lotDescendance", foreignKey: "lotDescendanceId" });

Abonne.hasMany(Vente, { foreignKey: "clientId", onDelete: "SET NULL" });
Vente.belongsTo(Abonne, { as: "client", foreignKey: "clientId" });

// Historique des versements d'une vente (avance + compléments).
Vente.hasMany(Paiement, { foreignKey: "venteId", onDelete: "CASCADE" });
Paiement.belongsTo(Vente, { foreignKey: "venteId" });

// À la création d'une vente avec une avance, on enregistre ce premier
// versement dans l'historique — ainsi tous les encaissements y figurent.
Vente.addHook("afterCreate", async (vente, options) => {
  const avance = vente.montantEncaisseFcfa || 0;
  if (avance > 0) {
    await Paiement.create(
      {
        venteId: vente.id,
        date: vente.date,
        montantFcfa: avance,
        observations: "Avance à la vente",
      },
      { transaction: options.transaction }
    );
  }
});

// Les rappels peuvent cibler une entrée du Cheptel, ou une vente non soldée
// (rappel de paiement).
Lot.hasMany(Rappel, { foreignKey: "lotId", onDelete: "CASCADE" });
Rappel.belongsTo(Lot, { foreignKey: "lotId" });
Vente.hasMany(Rappel, { foreignKey: "venteId", onDelete: "CASCADE" });
Rappel.belongsTo(Vente, { foreignKey: "venteId" });
// Une vaccination concerne toujours un groupe précis du Cheptel.
Lot.hasMany(Vaccination, { foreignKey: "lotId", onDelete: "CASCADE" });
Vaccination.belongsTo(Lot, { foreignKey: "lotId" });

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
  Paiement,
  Abonne,
  Rappel,
  Vaccination,
};
