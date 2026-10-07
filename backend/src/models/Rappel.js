const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Rappel = sequelize.define("Rappel", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  titre: { type: DataTypes.STRING, allowNull: false },
  type: {
    type: DataTypes.ENUM("Vaccination", "Aliment", "Réforme", "Paiement", "Autre"),
    allowNull: false,
    defaultValue: "Autre",
  },
  datePrevue: { type: DataTypes.DATEONLY, allowNull: false },
  statut: { type: DataTypes.ENUM("À faire", "Fait"), allowNull: false, defaultValue: "À faire" },
}, { tableName: "rappels", timestamps: true });

module.exports = Rappel;
