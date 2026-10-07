// Règles qui empêchent de livrer ou vendre plus que ce que la ferme possède.
// Ces contrôles sont faits côté serveur, sur les données réelles de la base :
// l'affichage du navigateur n'est qu'une aide, il ne remplace pas ce garde-fou.

const {
  nombre,
  enPalettes,
  formaterPalettes,
  bilanOeufs,
  bilanCheptel,
  sujetsVendus,
  TYPES_VOLAILLE,
} = require("./bilans");

// Chargés au moment de l'appel, pour ne pas figer de dépendance circulaire
// avec les modèles au démarrage.
const modeles = () => require("../models");

async function chargerOeufs() {
  return modeles().ProductionOeuf.findAll();
}
async function chargerCheptel() {
  const { Lot, Vente } = modeles();
  const [lots, ventes] = await Promise.all([
    Lot.findAll(),
    Vente.findAll({ where: { typeProduit: TYPES_VOLAILLE } }),
  ]);
  return { lots, ventes };
}

function refuserNegatifs(objet, champs) {
  for (const c of champs) {
    if (objet[c] != null && objet[c] !== "" && nombre(objet[c]) < 0) {
      throw new Error("Les quantités ne peuvent pas être négatives.");
    }
  }
}

// ---------------------------------------------------------------- Œufs

// Une entrée de production est refusée si, une fois enregistrée, le stock
// d'œufs de cette espèce deviendrait négatif — c'est-à-dire si on livre plus
// que la production du jour ajoutée au stock déjà en réserve.
async function validerEntreeOeufs(donnees, existante) {
  const base = existante ? existante.toJSON() : {};
  const e = { ...base, ...donnees };

  refuserNegatifs(e, [
    "productionCartons", "productionPalettes", "cassesNombre", "livreCartons", "livrePalettes",
  ]);

  const bilan = bilanOeufs(await chargerOeufs(), e.especeOeuf, {
    ignorerId: existante ? existante.id : undefined,
  });
  const produitJour = enPalettes(e.productionCartons, e.productionPalettes);
  const livre = enPalettes(e.livreCartons, e.livrePalettes);
  const disponible = bilan.stock + produitJour;

  if (livre > disponible) {
    throw new Error(
      `Livraison refusée : le stock disponible d'œufs de ${e.especeOeuf} est de ` +
        `${formaterPalettes(disponible)} (stock en réserve ${formaterPalettes(bilan.stock)} ` +
        `+ production saisie ${formaterPalettes(produitJour)}), ` +
        `alors que ${formaterPalettes(livre)} sont à livrer. ` +
        `Il manque ${formaterPalettes(livre - disponible)}.`
    );
  }
}

// Supprimer une production dont les œufs ont déjà été livrés laisserait un
// stock négatif : on refuse.
async function validerSuppressionOeufs(entree) {
  const bilan = bilanOeufs(await chargerOeufs(), entree.especeOeuf, { ignorerId: entree.id });
  if (bilan.stock < 0) {
    throw new Error(
      `Suppression impossible : les œufs de ${entree.especeOeuf} de cette entrée ont déjà été ` +
        `livrés. La supprimer laisserait un stock négatif (${formaterPalettes(bilan.stock)}).`
    );
  }
}

// ------------------------------------------------------------- Cheptel

// Une vente de volaille est refusée si elle dépasse l'effectif disponible
// du type d'animal concerné.
async function validerVenteCheptel(donnees, existante) {
  const base = existante ? existante.toJSON() : {};
  const v = { ...base, ...donnees };

  refuserNegatifs(v, ["quantite", "nombreSujets"]);

  if (!TYPES_VOLAILLE.includes(v.typeProduit)) return; // les œufs ne passent pas par le cheptel

  if (v.typeProduit === "Volaille effilée" && !(nombre(v.nombreSujets) > 0)) {
    throw new Error(
      "Indiquez le nombre de sujets effilés : il sert à mettre à jour l'effectif du cheptel " +
        "(la quantité, elle, est en kg)."
    );
  }

  const demande = sujetsVendus(v);
  if (!(demande > 0)) return;

  const { lots, ventes } = await chargerCheptel();
  const b = bilanCheptel(lots, ventes, v.sujet, { venteIgnoree: existante ? existante.id : undefined });

  if (demande > b.disponible) {
    throw new Error(
      `Vente refusée : il ne reste que ${b.disponible} ${v.sujet} dans le cheptel ` +
        `(${b.entres} entrés, ${b.morts} morts, ${b.vendus} déjà vendus). ` +
        `Vous essayez d'en vendre ${demande}.`
    );
  }
}

// Modifier une bande (effectif, mortalité, type) ne doit pas faire passer
// l'effectif disponible sous zéro par rapport aux ventes déjà enregistrées.
async function validerBande(donnees, existante) {
  const base = existante ? existante.toJSON() : {};
  const l = { ...base, ...donnees };

  refuserNegatifs(l, ["effectifInitial", "mortaliteCumulee", "ageArriveeJours"]);
  if (nombre(l.mortaliteCumulee) > nombre(l.effectifInitial)) {
    throw new Error("La mortalité ne peut pas dépasser l'effectif initial de la bande.");
  }
  if (!existante) return; // une nouvelle bande ne peut que faire monter l'effectif

  const candidate = {
    ...l,
    id: existante.id,
    effectifInitial: nombre(l.effectifInitial),
    mortaliteCumulee: nombre(l.mortaliteCumulee),
  };
  const { lots, ventes } = await chargerCheptel();
  for (const espece of new Set([candidate.espece, existante.espece])) {
    const b = bilanCheptel(lots, ventes, espece, { lotRemplace: candidate });
    if (b.disponible < 0) {
      throw new Error(
        `Modification refusée : il ne resterait que ${b.disponible} ${espece} alors que ` +
          `${b.vendus} ont déjà été vendus.`
      );
    }
  }
}

async function validerSuppressionBande(bande) {
  const { lots, ventes } = await chargerCheptel();
  const b = bilanCheptel(lots, ventes, bande.espece, { lotIgnore: bande.id });
  if (b.disponible < 0) {
    throw new Error(
      `Suppression impossible : ${b.vendus} ${bande.espece} ont déjà été vendus, supprimer cette ` +
        `bande laisserait un effectif négatif (${b.disponible}).`
    );
  }
}

module.exports = {
  chargerOeufs,
  chargerCheptel,
  validerEntreeOeufs,
  validerSuppressionOeufs,
  validerVenteCheptel,
  validerBande,
  validerSuppressionBande,
};
