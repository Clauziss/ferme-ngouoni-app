import React from "react";
import EntityPage from "../components/EntityPage";

const SUJETS = ["Poulets de chair", "Canards", "Pintades", "Pondeuses réforme", "Coquelets"];
const TYPES_PRODUIT = ["Volaille vivante", "Volaille effilée", "Oeufs"];
const SOUS_TYPES_OEUFS = ["En gros", "En détail"];

const aChoisiSujet = (v) => !!v.sujet;
const aChoisiType = (v) => !!v.sujet && !!v.typeProduit;
const estOeufs = (v) => v.typeProduit === "Oeufs";
const estVolaille = (v) => v.typeProduit === "Volaille vivante" || v.typeProduit === "Volaille effilée";
// Pour les œufs, les champs de saisie n'apparaissent qu'après le choix gros/détail.
const saisiePrete = (v) => estVolaille(v) || (estOeufs(v) && !!v.sousTypeOeufs);

function uniteQuantite(v) {
  if (v.typeProduit === "Volaille vivante") return "sujet(s)";
  if (v.typeProduit === "Volaille effilée") return "kg";
  if (v.sousTypeOeufs === "En gros") return "carton(s)";
  if (v.sousTypeOeufs === "En détail") return "palette(s)";
  return "";
}

const nombre = (x) => {
  const n = parseFloat(x);
  return Number.isFinite(n) ? n : 0;
};

const total = (v) => nombre(v.quantite) * nombre(v.prixUnitaireFcfa);
const reste = (v) => total(v) - nombre(v.montantEncaisseFcfa);
const formatFcfa = (n) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

export default function Ventes() {
  return (
    <EntityPage
      titre="Ventes"
      description="Choisis d'abord le type d'animal, puis la nature du produit vendu."
      endpoint="/ventes"
      colonnes={[
        { key: "date", label: "Date" },
        { key: "sujet", label: "Animal" },
        {
          key: "typeProduit", label: "Produit",
          render: (i) => (i.typeProduit === "Oeufs" ? `Œufs (${i.sousTypeOeufs || "—"})` : i.typeProduit),
        },
        { key: "client", label: "Client", render: (i) => i.client?.nom || "Occasionnel" },
        { key: "quantite", label: "Quantité", render: (i) => `${i.quantite} ${uniteQuantite(i)}` },
        { key: "prixUnitaireFcfa", label: "Prix unitaire", render: (i) => formatFcfa(i.prixUnitaireFcfa) },
        { key: "total", label: "Total", render: (i) => formatFcfa(total(i)) },
        { key: "encaisse", label: "Encaissé", render: (i) => formatFcfa(i.montantEncaisseFcfa || 0) },
        {
          key: "reste", label: "Reste à payer",
          render: (i) => {
            const r = reste(i);
            return <span className={r > 0 ? "erreur" : ""}>{formatFcfa(r)}</span>;
          },
        },
        { key: "observations", label: "Observation(s)", render: (i) => i.observations || "—" },
      ]}
      champs={[
        // 1. Le type d'animal, toujours en premier
        { name: "sujet", label: "Animal (type du cheptel)", type: "select", options: SUJETS, required: true },

        // 2. La nature du produit, une fois l'animal choisi
        { name: "typeProduit", label: "Type de produit", type: "select", options: TYPES_PRODUIT, required: true, visibleSi: aChoisiSujet },

        // 3. Pour les œufs uniquement : en gros ou en détail
        { name: "sousTypeOeufs", label: "Œufs — En gros ou En détail ?", type: "select", options: SOUS_TYPES_OEUFS, required: true, visibleSi: estOeufs },

        // 4. Les paramètres de la vente
        { name: "date", label: "Date", type: "date", required: true, visibleSi: saisiePrete },
        { name: "clientId", label: "Client (laisser vide si occasionnel)", optionsEndpoint: "/abonnes", optionLabel: "nom", visibleSi: saisiePrete },
        {
          name: "quantite", type: "number", min: 0, required: true, visibleSi: saisiePrete,
          label: (v) => `Quantité (${uniteQuantite(v)})`,
        },
        { name: "prixUnitaireFcfa", label: "Prix unitaire (FCFA)", type: "number", min: 0, required: true, visibleSi: saisiePrete },
        { id: "totalCalcule", name: "totalAffiche", label: "Total (calculé)", visibleSi: saisiePrete, calcule: (v) => formatFcfa(total(v)) },
        { name: "montantEncaisseFcfa", label: "Montant encaissé (FCFA)", type: "number", min: 0, required: true, visibleSi: saisiePrete },
        { id: "resteCalcule", name: "resteAffiche", label: "Reste à payer (calculé)", visibleSi: saisiePrete, calcule: (v) => formatFcfa(reste(v)) },
        { name: "observations", label: "Observation(s)", type: "textarea", visibleSi: saisiePrete },
      ]}
    />
  );
}
