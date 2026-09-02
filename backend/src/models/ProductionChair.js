const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// "Suivi de masse" — suivi de poids par type d'animal (plus de lien vers
// un lot précis : on saisit juste le type concerné).
const ProductionChair = sequelize.define("ProductionChair", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  sujet: {
    type: DataTypes.ENUM("Poulets de chair", "Canards", "Pintades", "Pondeuses réforme", "Coquelets"),
    allowNull: false,
  },
  poidsMinimalKg: { type: DataTypes.FLOAT, allowNull: true },
  poidsMaximalKg: { type: DataTypes.FLOAT, allowNull: true },
  poidsMoyenKg: { type: DataTypes.FLOAT, allowNull: false },
  nbSujetsPeses: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: "production_chair", timestamps: true });

module.exports = ProductionChair;
