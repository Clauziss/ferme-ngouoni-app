const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Production / Livré / Stock : en cartons + palettes (1 carton = 12 palettes = 360 œufs).
// Cassés : compté en nombre d'œufs (unité différente, saisie séparée).
const ProductionOeuf = sequelize.define("ProductionOeuf", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },

  // Espèce à l'origine de la ponte (liste propre aux œufs).
  especeOeuf: {
    type: DataTypes.ENUM("Poule", "Pintade", "Canard"),
    allowNull: false,
    defaultValue: "Poule",
  },

  productionCartons: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  productionPalettes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

  cassesNombre: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

  livreCartons: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  livrePalettes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

  stockCartons: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  stockPalettes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { tableName: "production_oeufs", timestamps: true });

module.exports = ProductionOeuf;
