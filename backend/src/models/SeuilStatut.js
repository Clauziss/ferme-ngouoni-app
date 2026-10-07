const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Âges (en jours) auxquels une bande change de statut, par espèce.
// Une ligne n'existe que si l'éleveur a personnalisé les seuils ; sinon ce
// sont les valeurs par défaut de utils/statuts.js qui s'appliquent.
const SeuilStatut = sequelize.define("SeuilStatut", {
  espece: { type: DataTypes.STRING, primaryKey: true },
  joursAgeMoyen: { type: DataTypes.INTEGER, allowNull: false },
  joursPretAbattre: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: "seuils_statut", timestamps: true });

module.exports = SeuilStatut;
