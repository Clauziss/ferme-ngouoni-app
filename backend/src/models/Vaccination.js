const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Journal des vaccinations effectuées sur un groupe du Cheptel.
// Le lien vers un lot précis (et non vers une simple espèce) est volontaire :
// en aviculture, le protocole dépend de l'âge du lot, et deux bandes de la
// même espèce entrées à des dates différentes ne se vaccinent pas ensemble.
const Vaccination = sequelize.define("Vaccination", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  nomVaccin: { type: DataTypes.STRING, allowNull: false },
  maladie: { type: DataTypes.STRING, allowNull: true },
  modeAdministration: {
    type: DataTypes.ENUM(
      "Eau de boisson",
      "Goutte oculaire",
      "Goutte nasale",
      "Injection",
      "Spray / nébulisation",
      "Transpercement de l'aile",
      "Autre"
    ),
    allowNull: false,
    defaultValue: "Eau de boisson",
  },
  nombreSujets: { type: DataTypes.INTEGER, allowNull: true },
  dose: { type: DataTypes.STRING, allowNull: true },
  coutFcfa: { type: DataTypes.FLOAT, allowNull: true },
  // Date du prochain rappel de ce vaccin, quand le protocole en prévoit un.
  dateRappel: { type: DataTypes.DATEONLY, allowNull: true },
  observations: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "vaccinations", timestamps: true });

module.exports = Vaccination;
