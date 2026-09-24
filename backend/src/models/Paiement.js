const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Historique des versements sur une vente. Le premier versement (avance)
// est enregistré automatiquement à la création de la vente ; les suivants
// sont ajoutés au fur et à mesure que le client complète son paiement.
const Paiement = sequelize.define("Paiement", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  montantFcfa: { type: DataTypes.FLOAT, allowNull: false },
  observations: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "paiements", timestamps: true });

module.exports = Paiement;
