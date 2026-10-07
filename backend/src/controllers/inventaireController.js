const { bilanOeufs, bilanCheptel } = require("../utils/bilans");
const { decrireLot } = require("../utils/statuts");
const { chargerSeuils } = require("../utils/seuils");
const { chargerOeufs, chargerCheptel } = require("../utils/stock");

const TYPES_ANIMAUX = ["Poulets de chair", "Canards", "Pintades", "Pondeuses réforme", "Coquelets"];
const ESPECES_OEUFS = ["Poule", "Pintade", "Canard"];

const somme = (liste, cle) => liste.reduce((s, x) => s + x[cle], 0);

// Photo de la ferme à l'instant présent : ce qu'il y a dans le cheptel
// (par type et par bande) et ce qu'il y a en stock d'œufs.
// Le même résultat sert à la page Inventaire, au bandeau du Cheptel, à la
// page Production d'œufs et au formulaire de Ventes : tout reste synchronisé.
async function inventaire(req, res) {
  const [{ lots, ventes }, entreesOeufs, seuils] = await Promise.all([chargerCheptel(), chargerOeufs(), chargerSeuils()]);
  const maintenant = new Date();

  // ---- Cheptel par type (ventes déduites)
  const parType = TYPES_ANIMAUX.map((type) => ({
    type,
    ...bilanCheptel(lots, ventes, type),
  }));

  // ---- Détail par bande : statut, ancienneté, effectif avant ventes
  const bandes = lots
    .map((l) => l.toJSON())
    .sort((a, b) => (a.espece === b.espece ? (a.dateEntree < b.dateEntree ? -1 : 1) : a.espece < b.espece ? -1 : 1))
    .map((l) => ({
      id: l.id,
      type: l.espece,
      dateEntree: l.dateEntree,
      // Âge et statut CALCULÉS (âge à l'arrivée + temps passé à la ferme).
      ...decrireLot(l, seuils, maintenant),
      effectifInitial: l.effectifInitial,
      mortaliteCumulee: l.mortaliteCumulee,
      effectifApresMortalite: l.effectifInitial - l.mortaliteCumulee,
    }));

  // ---- Œufs par espèce
  const oeufsParEspece = ESPECES_OEUFS.map((espece) => {
    const b = bilanOeufs(entreesOeufs, espece);
    return {
      espece,
      produitPalettes: b.produit,
      livrePalettes: b.livre,
      stockPalettes: b.stock,
      cassesNombre: b.casses,
    };
  });

  res.json({
    cheptel: {
      parType,
      bandes,
      total: {
        bandes: somme(parType, "bandes"),
        entres: somme(parType, "entres"),
        morts: somme(parType, "morts"),
        vendus: somme(parType, "vendus"),
        disponible: somme(parType, "disponible"),
      },
    },
    oeufs: {
      parEspece: oeufsParEspece,
      total: {
        produitPalettes: somme(oeufsParEspece, "produitPalettes"),
        livrePalettes: somme(oeufsParEspece, "livrePalettes"),
        stockPalettes: somme(oeufsParEspece, "stockPalettes"),
        cassesNombre: somme(oeufsParEspece, "cassesNombre"),
      },
    },
    dateReleve: new Date().toISOString(),
  });
}

module.exports = { inventaire };
