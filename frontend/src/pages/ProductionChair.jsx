import React from "react";
import EntityPage from "../components/EntityPage";

const SUJETS = ["Poulets de chair", "Canards", "Pintades", "Pondeuses réforme", "Coquelets"];

export default function ProductionChair() {
  return (
    <EntityPage
      titre="Suivi de masse"
      description="Suivi de poids par type d'animal."
      endpoint="/production-chair"
      colonnes={[
        { key: "date", label: "Date" },
        { key: "sujet", label: "Sujet" },
        { key: "poidsMinimalKg", label: "Poids min. (kg)" },
        { key: "poidsMaximalKg", label: "Poids max. (kg)" },
        { key: "poidsMoyenKg", label: "Poids moyen (kg)" },
        { key: "nbSujetsPeses", label: "Nombre de sujets pesés" },
        { key: "remarque", label: "Remarque", render: (i) => i.remarque || "—" },
        { key: "appreciation", label: "Appréciation", render: (i) => i.appreciation || "—" },
      ]}
      champs={[
        { name: "date", label: "Date", type: "date", required: true },
        { name: "sujet", label: "Sujet", type: "select", options: SUJETS, required: true },
        { name: "poidsMinimalKg", label: "Poids minimal (kg)", type: "number" },
        { name: "poidsMaximalKg", label: "Poids maximal (kg)", type: "number" },
        { name: "poidsMoyenKg", label: "Poids moyen (kg)", type: "number", required: true },
        { name: "nbSujetsPeses", label: "Nombre de sujets pesés", type: "number", required: true },
        { name: "remarque", label: "Remarque", type: "textarea", placeholder: "ex : lot homogène, quelques sujets en retard" },
        { name: "appreciation", label: "Appréciation", type: "textarea", placeholder: "ex : croissance satisfaisante" },
      ]}
    />
  );
}
