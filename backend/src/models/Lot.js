const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// "Cheptel" — registre des groupes d'animaux. N'est plus référencé par les
// autres modules (production, dépenses, ventes s'appuient sur un simple
// champ "sujet"/"type" au lieu d'un lien vers une entrée précise ici).
const Lot = sequelize.define("Lot", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  espece: {
    type: DataTypes.ENUM("Poulets de chair", "Canards", "Pintades", "Pondeuses réforme", "Coquelets"),
    allowNull: false,
  },
  dateEntree: { type: DataTypes.DATEONLY, allowNull: false },
  effectifInitial: { type: DataTypes.INTEGER, allowNull: false },
  // Âge des animaux le jour de leur arrivée (0 = poussins d'un jour). Il
  // s'ajoute au temps passé à la ferme pour obtenir l'âge réel de la bande.
  ageArriveeJours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  mortaliteCumulee: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  // HÉRITAGE : ancienne valeur saisie à la main, désormais IGNORÉE. Le statut
  // réel est calculé à chaque lecture d'après l'âge (voir utils/statuts.js).
  // La colonne est conservée telle quelle pour ne pas toucher à la base.
  statut: {
    type: DataTypes.ENUM("Poussin", "Âge moyen", "Prêt à abattre"),
    allowNull: false,
    defaultValue: "Poussin",
  },
}, {
  tableName: "lots",
  timestamps: true,
  getterMethods: {
    effectifActuel() {
      return this.effectifInitial - this.mortaliteCumulee;
    },
  },
});

module.exports = Lot;
