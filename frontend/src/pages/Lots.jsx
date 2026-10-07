import React, { useState } from "react";
import EntityPage from "../components/EntityPage";
import SeuilsStatut from "../components/SeuilsStatut";
import { useInventaire, formaterDuree, formaterDelai } from "../utils/inventaire";

const TYPES = ["Poulets de chair", "Canards", "Pintades", "Pondeuses réforme", "Coquelets"];

// Statut calculé par le serveur d'après l'âge ; on indique aussi le prochain palier.
// Le tout est enveloppé dans un seul bloc pour garder une seule cellule en
// affichage "carte" sur téléphone.
function celluleStatut(l) {
  return (
    <div>
      <span className={`puce ${l.statut === "Prêt à abattre" ? "ok" : "neutre"}`}>{l.statut}</span>
      {l.prochainStatut && (
        <div className="sous-texte">→ {l.prochainStatut} dans {formaterDelai(l.joursAvantProchainStatut)}</div>
      )}
    </div>
  );
}

export default function Lots() {
  const { inventaire, recharger } = useInventaire();
  const cheptel = inventaire?.cheptel;

  // Quand les seuils changent, les statuts du tableau changent aussi : on
  // recrée le tableau (via sa clé) pour qu'il recharge les données.
  const [version, setVersion] = useState(0);

  // Effectif réellement disponible par type : mortalité et ventes déduites.
  const bandeau = cheptel && (
    <div className="grille-stats">
      <div className="carte-oeuf">
        <div className="label">🐔 Total du cheptel</div>
        <div className="valeur">{cheptel.total.disponible}</div>
        <div className="contexte">sujets disponibles</div>
      </div>
      {cheptel.parType.map((t) => (
        <div className="carte-oeuf" key={t.type}>
          <div className="label">{t.type}</div>
          <div className="valeur">{t.disponible}</div>
          <div className="contexte">
            {t.entres} entrés · {t.morts} morts · {t.vendus} vendus
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <EntityPage
        key={version}
        titre="Cheptel"
        description="Groupes d'animaux suivis sur la ferme. Les totaux déduisent les morts et les ventes ; le statut se calcule d'après l'âge."
        endpoint="/lots"
        bandeau={bandeau}
        apresChangement={recharger}
        colonnes={[
          { key: "espece", label: "Type" },
          { key: "dateEntree", label: "Entrée" },
          { key: "ageArrivee", label: "Âge à l'arrivée", render: (l) => (l.ageArriveeJours > 0 ? formaterDuree(l.ageArriveeJours) : "1 jour ou moins") },
          { key: "joursALaFerme", label: "Temps à la ferme", render: (l) => formaterDuree(l.joursALaFerme) },
          { key: "effectifInitial", label: "Effectif initial" },
          { key: "mortaliteCumulee", label: "Mortalité" },
          { key: "effectifActuel", label: "Après mortalité", render: (l) => l.effectifInitial - l.mortaliteCumulee },
          { key: "statut", label: "Statut", render: celluleStatut },
        ]}
        champs={[
          { name: "espece", label: "Type", type: "select", options: TYPES, required: true },
          { name: "dateEntree", label: "Date d'entrée", type: "date", required: true },
          { name: "ageArriveeJours", label: "Âge à l'arrivée (jours)", type: "number", min: 0, placeholder: "0 si poussins d'un jour" },
          { name: "effectifInitial", label: "Effectif initial", type: "number", required: true },
          { name: "mortaliteCumulee", label: "Mortalité cumulée", type: "number" },
        ]}
      />
      <SeuilsStatut onEnregistre={() => { setVersion((v) => v + 1); recharger(); }} />
    </>
  );
}
