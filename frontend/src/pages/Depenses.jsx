import React from "react";
import EntityPage from "../components/EntityPage";

const POULAILLERS = ["Poulets de chair", "Canards", "Pintades", "Pondeuses réforme", "Coquelets", "Ferme"];
const CATEGORIES = [
  "Aliment de croissance",
  "Aliment de démarrage",
  "Aliment de ponte",
  "Autre",
  "Équipement",
  "Main d'oeuvre",
  "Matériel",
  "Médicaments",
  "Transport",
  "Vaccin",
  "Vitamines",
];

export default function Depenses() {
  return (
    <EntityPage
      titre="Dépenses"
      description="Chaque dépense rattachée à un poulailler (type d'animal, ou 'Ferme' pour une dépense générale)."
      endpoint="/depenses"
      colonnes={[
        { key: "date", label: "Date" },
        { key: "poulailler", label: "Poulailler" },
        { key: "categorie", label: "Catégorie" },
        { key: "description", label: "Description" },
        { key: "montantFcfa", label: "Montant", render: (i) => `${i.montantFcfa.toLocaleString("fr-FR")} FCFA` },
      ]}
      champs={[
        { name: "date", label: "Date", type: "date", required: true },
        { name: "poulailler", label: "Poulailler", type: "select", options: POULAILLERS, required: true },
        { name: "categorie", label: "Catégorie", type: "select", options: CATEGORIES, required: true },
        { name: "description", label: "Description" },
        { name: "montantFcfa", label: "Montant (FCFA)", type: "number", required: true },
      ]}
    />
  );
}
