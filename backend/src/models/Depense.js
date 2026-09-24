const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Depense = sequelize.define("Depense", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  // "Poulailler" côté interface — type d'animal concerné, ou "Ferme" pour une
  // dépense générale non rattachée à une espèce précise.
  poulailler: {
    type: DataTypes.ENUM("Poulets de chair", "Canards", "Pintades", "Pondeuses réforme", "Coquelets", "Ferme"),
    allowNull: false,
  },
  categorie: {
    type: DataTypes.ENUM(
      "Aliment de croissance",
      "Aliment de démarrage",
      "Aliment de ponte",
      "Autre",
      "Équipement",
      "Main d'oeuvre",
      "Matériel",
      "Médicaments",
      "Transport",
      "Vaccin",
      "Vitamines"
    ),
    allowNull: false,
  },
  description: { type: DataTypes.STRING, allowNull: true },
  montantFcfa: { type: DataTypes.FLOAT, allowNull: false },
}, { tableName: "depenses", timestamps: true });

module.exports = Depense;
