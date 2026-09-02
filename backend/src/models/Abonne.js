const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Abonne = sequelize.define("Abonne", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom: { type: DataTypes.STRING, allowNull: false },
  ville: { type: DataTypes.STRING, allowNull: true },
  contacts: { type: DataTypes.STRING, allowNull: true },
}, { tableName: "abonnes", timestamps: true });

module.exports = Abonne;
