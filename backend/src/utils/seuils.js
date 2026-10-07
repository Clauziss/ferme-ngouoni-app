// Accès base de données pour les seuils de statut, et enrichissement des
// bandes avec leur statut calculé. La logique de calcul est dans statuts.js.

const { fusionnerSeuils, decrireLot } = require("./statuts");

// Chargé au moment de l'appel pour ne pas créer de dépendance circulaire.
const modeles = () => require("../models");
const plat = (x) => (x && typeof x.toJSON === "function" ? x.toJSON() : x);

async function chargerSeuils() {
  const lignes = await modeles().SeuilStatut.findAll();
  return fusionnerSeuils(lignes);
}

// Ajoute à chaque bande son âge et son statut calculés (le statut stocké en
// base, ancienne saisie manuelle, est écrasé).
async function enrichirLots(lots) {
  const seuils = await chargerSeuils();
  const maintenant = new Date();
  return lots.map((l) => {
    const brut = plat(l);
    return { ...brut, ...decrireLot(brut, seuils, maintenant) };
  });
}

module.exports = { chargerSeuils, enrichirLots };
