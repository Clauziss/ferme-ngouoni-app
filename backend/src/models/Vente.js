const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Parcours de saisie : on choisit d'abord le type d'animal (sujet), puis la
// nature du produit vendu.
//   Volaille vivante : quantite = nombre de sujets (sans unité).
//   Volaille effilée  : quantite = poids en kg.
//   Oeufs "En gros"   : quantite = nombre de cartons.
//   Oeufs "En détail" : quantite = nombre de palettes.
// Dans tous les cas : total = quantite * prixUnitaireFcfa,
// et resteAPayer = total - montantEncaisse (calculés à l'affichage).
const Vente = sequelize.define("Vente", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  sujet: {
    type: DataTypes.ENUM("Poulets de chair", "Canards", "Pintades", "Pondeuses réforme", "Coquelets"),
    allowNull: false,
  },
  typeProduit: {
    type: DataTypes.ENUM("Volaille vivante", "Volaille effilée", "Oeufs"),
    allowNull: false,
  },
  // Uniquement pour typeProduit = "Oeufs"
  sousTypeOeufs: {
    type: DataTypes.ENUM("En gros", "En détail"),
    allowNull: true,
  },
  quantite: { type: DataTypes.FLOAT, allowNull: false },
  prixUnitaireFcfa: { type: DataTypes.FLOAT, allowNull: false },
  montantEncaisseFcfa: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  observations: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "ventes",
  timestamps: true,
});

module.exports = Vente;
