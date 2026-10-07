import React from "react";
import EntityPage from "../components/EntityPage";
import { useInventaire, formaterPalettes, enPalettes } from "../utils/inventaire";

const ESPECES_OEUFS = ["Poule", "Pintade", "Canard"];

export default function ProductionOeufs() {
  const { inventaire, recharger } = useInventaire();
  const oeufs = inventaire?.oeufs;

  // Stock en réserve de l'espèce choisie dans le formulaire.
  const stockEspece = (espece) =>
    oeufs?.parEspece.find((e) => e.espece === espece)?.stockPalettes ?? 0;

  // Ce qu'on pourrait livrer avec la saisie en cours :
  // stock en réserve + production saisie.
  const disponiblePourLivrer = (v) =>
    stockEspece(v.especeOeuf) + enPalettes(v.productionCartons, v.productionPalettes);

  const stockApresSaisie = (v) =>
    disponiblePourLivrer(v) - enPalettes(v.livreCartons, v.livrePalettes);

  const bandeau = oeufs && (
    <div className="grille-stats">
      <div className="carte-oeuf">
        <div className="label">📦 Stock total d'œufs</div>
        <div className="valeur" style={{ fontSize: "1.35rem" }}>
          {formaterPalettes(oeufs.total.stockPalettes)}
        </div>
        <div className="contexte">Poule + Pintade + Canard</div>
      </div>
      {oeufs.parEspece.map((e) => (
        <div className="carte-oeuf" key={e.espece}>
          <div className="label">Œufs de {e.espece.toLowerCase()}</div>
          <div className="valeur" style={{ fontSize: "1.35rem" }}>
            {formaterPalettes(e.stockPalettes)}
          </div>
          <div className="contexte">en stock</div>
        </div>
      ))}
    </div>
  );

  return (
    <EntityPage
      titre="Production d'œufs"
      description="Production et livraisons en cartons + palettes (1 carton = 12 palettes = 360 œufs). Le stock se calcule tout seul."
      endpoint="/production-oeufs"
      bandeau={bandeau}
      apresChangement={recharger}
      colonnes={[
        { key: "date", label: "Date" },
        { key: "especeOeuf", label: "Œufs de" },
        { key: "production", label: "Production", render: (i) => formaterPalettes(enPalettes(i.productionCartons, i.productionPalettes)) },
        { key: "casses", label: "Cassés", render: (i) => `${i.cassesNombre || 0} œuf(s)` },
        { key: "livre", label: "Livré", render: (i) => formaterPalettes(enPalettes(i.livreCartons, i.livrePalettes)) },
        { key: "stockApres", label: "Stock après cette ligne", render: (i) => formaterPalettes(i.stockApresPalettes) },
      ]}
      champs={[
        { name: "date", label: "Date", type: "date", required: true },
        { name: "especeOeuf", label: "Œufs de", type: "select", options: ESPECES_OEUFS, required: true },
        { name: "productionCartons", label: "Production — Cartons", type: "number", min: 0, required: true },
        { name: "productionPalettes", label: "Production — Palettes (0-11)", type: "number", min: 0, max: 11 },
        { name: "cassesNombre", label: "Cassés — Nombre d'œufs", type: "number", min: 0 },
        { name: "livreCartons", label: "Livré — Cartons", type: "number", min: 0 },
        { name: "livrePalettes", label: "Livré — Palettes (0-11)", type: "number", min: 0, max: 11 },
        {
          id: "stockReserve", name: "stockReserveAffiche", label: "Stock en réserve (cette espèce)",
          visibleSi: (v) => !!v.especeOeuf,
          calcule: (v) => formaterPalettes(stockEspece(v.especeOeuf)),
        },
        {
          id: "stockApres", name: "stockApresAffiche", label: "Stock après cette saisie",
          visibleSi: (v) => !!v.especeOeuf,
          calcule: (v) => {
            const apres = stockApresSaisie(v);
            return apres < 0
              ? `⚠ Livraison trop élevée — il manque ${formaterPalettes(-apres)}`
              : formaterPalettes(apres);
          },
        },
      ]}
    />
  );
}
