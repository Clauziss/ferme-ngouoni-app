import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

// 1 carton = 12 palettes (1 palette = 30 œufs). Les quantités circulent en
// palettes entre le serveur et l'écran, et ne sont découpées en cartons +
// palettes qu'au moment de l'affichage.
export const PALETTES_PAR_CARTON = 12;

export function decouperPalettes(total) {
  const p = Math.round(total || 0);
  const abs = Math.abs(p);
  return {
    negatif: p < 0,
    cartons: Math.floor(abs / PALETTES_PAR_CARTON),
    palettes: abs % PALETTES_PAR_CARTON,
  };
}

export function formaterPalettes(total) {
  const { negatif, cartons, palettes } = decouperPalettes(total);
  return `${negatif ? "−" : ""}${cartons} carton${cartons > 1 ? "s" : ""}, ${palettes} palette${palettes > 1 ? "s" : ""}`;
}

export const enPalettes = (cartons, palettes) =>
  (parseInt(cartons, 10) || 0) * PALETTES_PAR_CARTON + (parseInt(palettes, 10) || 0);

// Durée à la ferme, lisible : "12 jours", "6 sem. 3 j", "4 mois 12 j".
export function formaterDuree(jours) {
  if (jours == null) return "—";
  if (jours < 14) return `${jours} jour${jours > 1 ? "s" : ""}`;
  if (jours < 90) {
    const sem = Math.floor(jours / 7);
    const reste = jours % 7;
    return reste ? `${sem} sem. ${reste} j` : `${sem} sem.`;
  }
  const mois = Math.floor(jours / 30);
  const reste = jours % 30;
  return reste ? `${mois} mois ${reste} j` : `${mois} mois`;
}

// Délai avant un changement de statut : en jours tant que c'est proche
// ("dans 20 jours"), puis en semaines/mois quand c'est lointain.
export function formaterDelai(jours) {
  if (jours == null) return "—";
  if (jours < 60) return `${jours} jour${jours > 1 ? "s" : ""}`;
  return formaterDuree(jours);
}

// Charge l'inventaire de la ferme et expose `recharger`, à appeler après
// chaque saisie qui modifie le stock ou l'effectif.
export function useInventaire() {
  const [inventaire, setInventaire] = useState(null);
  const [erreur, setErreur] = useState("");

  const recharger = useCallback(() => {
    return api
      .get("/inventaire")
      .then((d) => { setInventaire(d); setErreur(""); })
      .catch((e) => setErreur(e.message));
  }, []);

  useEffect(() => { recharger(); }, [recharger]);

  return { inventaire, erreur, recharger };
}
