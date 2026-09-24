const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Reproduction = sequelize.define("Reproduction", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  dateMiseCouvee: { type: DataTypes.DATEONLY, allowNull: false },
  nbOeufsCouves: { type: DataTypes.INTEGER, allowNull: false },
  nbEclos: { type: DataTypes.INTEGER, allowNull: true },
  dateEclosionPrevue: { type: DataTypes.DATEONLY, allowNull: true },
}, { tableName: "reproductions", timestamps: true });

module.exports = Reproduction;
