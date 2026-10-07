import React from "react";
import EntityPage from "../components/EntityPage";

const MODES = [
  "Eau de boisson",
  "Goutte oculaire",
  "Goutte nasale",
  "Injection",
  "Spray / nébulisation",
  "Transpercement de l'aile",
  "Autre",
];

const formatFcfa = (n) => (n == null ? "—" : `${Math.round(n).toLocaleString("fr-FR")} FCFA`);

// Deux bandes de la même espèce peuvent coexister : on les distingue par
// leur date d'entrée, sinon la liste déroulante est ambiguë.
function libelleLot(lot) {
  return `${lot.espece} — entré le ${lot.dateEntree}`;
}

// Âge du lot le jour de la vaccination : c'est lui qui détermine le protocole.
function ageAuMomentDuVaccin(v) {
  if (!v.Lot?.dateEntree || !v.date) return "—";
  const jours = Math.round(
    (new Date(v.date) - new Date(v.Lot.dateEntree)) / (1000 * 60 * 60 * 24)
  );
  if (jours < 0) return "—";
  if (jours < 7) return `${jours} j`;
  const semaines = Math.floor(jours / 7);
  const reste = jours % 7;
  return reste ? `${semaines} sem. ${reste} j` : `${semaines} sem.`;
}

function celluleRappel(v) {
  if (!v.dateRappel) return "—";
  const aujourdHui = new Date().toISOString().slice(0, 10);
  const enRetard = v.dateRappel < aujourdHui;
  const aujourdHuiMeme = v.dateRappel === aujourdHui;
  return (
    <span className={`puce ${enRetard || aujourdHuiMeme ? "alerte" : "neutre"}`}>
      {v.dateRappel}
      {enRetard ? " — dépassé" : aujourdHuiMeme ? " — aujourd'hui" : ""}
    </span>
  );
}

export default function Vaccinations() {
  return (
    <EntityPage
      titre="Suivi des vaccins"
      description="Journal des vaccinations par bande du cheptel, avec l'âge des sujets au moment de l'acte."
      endpoint="/vaccinations"
      colonnes={[
        { key: "date", label: "Date" },
        { key: "lot", label: "Bande", render: (v) => (v.Lot ? v.Lot.espece : "—") },
        { key: "age", label: "Âge", render: ageAuMomentDuVaccin },
        { key: "nomVaccin", label: "Vaccin" },
        { key: "maladie", label: "Maladie visée", render: (v) => v.maladie || "—" },
        { key: "modeAdministration", label: "Administration" },
        { key: "nombreSujets", label: "Sujets", render: (v) => v.nombreSujets ?? "—" },
        { key: "coutFcfa", label: "Coût", render: (v) => formatFcfa(v.coutFcfa) },
        { key: "dateRappel", label: "Rappel prévu", render: celluleRappel },
        { key: "observations", label: "Observation(s)", render: (v) => v.observations || "—" },
      ]}
      champs={[
        { name: "date", label: "Date de la vaccination", type: "date", required: true },
        {
          name: "lotId", label: "Bande concernée", required: true,
          optionsEndpoint: "/lots", optionLabelFn: libelleLot,
        },
        { name: "nomVaccin", label: "Nom du vaccin", required: true, placeholder: "ex : Gumboro intermédiaire" },
        { name: "maladie", label: "Maladie visée", placeholder: "ex : Maladie de Gumboro" },
        { name: "modeAdministration", label: "Mode d'administration", type: "select", options: MODES, required: true },
        { name: "nombreSujets", label: "Nombre de sujets vaccinés", type: "number", min: 0 },
        { name: "dose", label: "Dose", placeholder: "ex : 0,5 ml par sujet" },
        { name: "coutFcfa", label: "Coût (FCFA)", type: "number", min: 0 },
        { name: "dateRappel", label: "Rappel prévu le (facultatif)", type: "date" },
        { name: "observations", label: "Observation(s)", type: "textarea" },
      ]}
    />
  );
}
