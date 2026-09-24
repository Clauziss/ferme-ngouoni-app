import React from "react";
import EntityPage from "../components/EntityPage";

const ESPECES_OEUFS = ["Poule", "Pintade", "Canard"];
const PALETTES_PAR_CARTON = 12;

function formatCartons(cartons, palettes) {
  const c = cartons || 0, p = palettes || 0;
  return `${c} carton${c !== 1 ? "s" : ""}, ${p} palette${p !== 1 ? "s" : ""}`;
}

const nombre = (x) => {
  const n = parseInt(x, 10);
  return Number.isFinite(n) ? n : 0;
};

// Stock = Production − Livré, calculé en palettes puis reconverti.
function stockCalcule(v) {
  const produitEnPalettes =
    nombre(v.productionCartons) * PALETTES_PAR_CARTON + nombre(v.productionPalettes);
  const livreEnPalettes =
    nombre(v.livreCartons) * PALETTES_PAR_CARTON + nombre(v.livrePalettes);
  const restant = produitEnPalettes - livreEnPalettes;

  if (restant < 0) return { negatif: true, cartons: 0, palettes: 0 };
  return {
    negatif: false,
    cartons: Math.floor(restant / PALETTES_PAR_CARTON),
    palettes: restant % PALETTES_PAR_CARTON,
  };
}

export default function ProductionOeufs() {
  return (
    <EntityPage
      titre="Production d'œufs"
      description="Production/Livré en cartons + palettes (1 carton = 12 palettes = 360 œufs). Le stock se calcule tout seul."
      endpoint="/production-oeufs"
      colonnes={[
        { key: "date", label: "Date" },
        { key: "especeOeuf", label: "Œufs de" },
        { key: "production", label: "Production", render: (i) => formatCartons(i.productionCartons, i.productionPalettes) },
        { key: "casses", label: "Cassés", render: (i) => `${i.cassesNombre || 0} œuf(s)` },
        { key: "livre", label: "Livré", render: (i) => formatCartons(i.livreCartons, i.livrePalettes) },
        { key: "stock", label: "Stock", render: (i) => formatCartons(i.stockCartons, i.stockPalettes) },
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
          id: "stockAffiche", name: "stockAffiche", label: "Stock restant (calculé)",
          calcule: (v) => {
            const s = stockCalcule(v);
            return s.negatif
              ? "⚠ Livré supérieur à la production"
              : formatCartons(s.cartons, s.palettes);
          },
        },
      ]}
      // Le stock n'est pas saisi : on le calcule avant l'envoi au serveur.
      transformerAvantEnvoi={(v) => {
        const s = stockCalcule(v);
        return { ...v, stockCartons: s.cartons, stockPalettes: s.palettes };
      }}
    />
  );
}
