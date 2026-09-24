import React from "react";
import EntityPage from "../components/EntityPage";

const TYPES = ["Poulets de chair", "Canards", "Pintades", "Pondeuses réforme", "Coquelets"];
const STATUTS = ["Poussin", "Âge moyen", "Prêt à abattre"];

export default function Lots() {
  return (
    <EntityPage
      titre="Cheptel"
      description="Groupes d'animaux suivis sur la ferme."
      endpoint="/lots"
      colonnes={[
        { key: "espece", label: "Type" },
        { key: "dateEntree", label: "Entrée" },
        { key: "effectifInitial", label: "Effectif initial" },
        { key: "mortaliteCumulee", label: "Mortalité" },
        { key: "effectifActuel", label: "Effectif actuel", render: (l) => l.effectifInitial - l.mortaliteCumulee },
        {
          key: "statut", label: "Statut",
          render: (l) => (
            <span className={`puce ${l.statut === "Prêt à abattre" ? "ok" : "neutre"}`}>{l.statut}</span>
          ),
        },
      ]}
      champs={[
        { name: "espece", label: "Type", type: "select", options: TYPES, required: true },
        { name: "dateEntree", label: "Date d'entrée", type: "date", required: true },
        { name: "effectifInitial", label: "Effectif initial", type: "number", required: true },
        { name: "mortaliteCumulee", label: "Mortalité cumulée", type: "number" },
        { name: "statut", label: "Statut", type: "select", options: STATUTS, required: true },
      ]}
    />
  );
}
