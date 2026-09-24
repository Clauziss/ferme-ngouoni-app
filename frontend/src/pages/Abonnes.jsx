import React from "react";
import EntityPage from "../components/EntityPage";

export default function Abonnes() {
  return (
    <EntityPage
      titre="Abonnés"
      description="Clients réguliers de la ferme."
      endpoint="/abonnes"
      colonnes={[
        { key: "nom", label: "Noms" },
        { key: "ville", label: "Ville" },
        { key: "contacts", label: "Contact(s)" },
      ]}
      champs={[
        { name: "nom", label: "Noms", required: true },
        { name: "ville", label: "Ville" },
        { name: "contacts", label: "Contact(s)" },
      ]}
    />
  );
}
