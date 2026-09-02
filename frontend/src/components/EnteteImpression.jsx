import React from "react";
import logo from "../assets/logo.jpg";

// Visible uniquement à l'impression (voir @media print dans index.css) —
// donne un en-tête propre avec logo et titre sur les rapports imprimés.
export default function EnteteImpression({ titre, sousTitre }) {
  return (
    <div className="entete-impression">
      <img src={logo} alt="Ferme de Ngouoni" />
      <div>
        <div className="titre-ferme">Ferme de Ngouoni</div>
        <div className="titre-rapport">{titre} {sousTitre ? `— ${sousTitre}` : ""} — imprimé le {new Date().toLocaleDateString("fr-FR")}</div>
      </div>
    </div>
  );
}
