import React from "react";
import EntityPage from "../components/EntityPage";

export default function Reproduction() {
  return (
    <EntityPage
      titre="Reproduction / Couvées"
      description="Une ligne par couvée mise en incubation."
      endpoint="/reproduction"
      colonnes={[
        { key: "dateMiseCouvee", label: "Mise en couvée" },
        { key: "nbOeufsCouves", label: "Œufs couvés" },
        { key: "nbEclos", label: "Éclos" },
        { key: "taux", label: "Taux éclosion", render: (i) => (i.nbEclos != null ? `${((i.nbEclos / i.nbOeufsCouves) * 100).toFixed(1)} %` : "—") },
        { key: "dateEclosionPrevue", label: "Éclosion prévue" },
      ]}
      champs={[
        { name: "dateMiseCouvee", label: "Date de mise en couvée", type: "date", required: true },
        { name: "lotGeniteurId", label: "Lot géniteur", optionsEndpoint: "/lots", optionLabel: "espece", required: true },
        { name: "nbOeufsCouves", label: "Œufs couvés", type: "number", required: true },
        { name: "nbEclos", label: "Éclos (à remplir après incubation)", type: "number" },
        { name: "dateEclosionPrevue", label: "Éclosion prévue", type: "date" },
      ]}
    />
  );
}
