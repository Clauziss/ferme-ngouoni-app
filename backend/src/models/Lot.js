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
  mortaliteCumulee: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
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
