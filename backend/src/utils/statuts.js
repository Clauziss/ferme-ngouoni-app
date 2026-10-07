// Statut d'une bande du Cheptel, calculé d'après son âge — fonctions pures
// (aucun accès base de données), afin de pouvoir les tester isolément.
//
//   âge total = âge à l'arrivée + jours passés à la ferme
//   Poussin        : âge < joursAgeMoyen
//   Âge moyen      : joursAgeMoyen ≤ âge < joursPretAbattre
//   Prêt à abattre : âge ≥ joursPretAbattre
//
// Les seuils dépendent de l'espèce et sont modifiables dans l'application
// (voir utils/seuils.js). Les valeurs ci-dessous ne sont que des repères
// courants : l'éleveur doit les ajuster selon ses races et son marché.

const ESPECES = ["Poulets de chair", "Canards", "Pintades", "Pondeuses réforme", "Coquelets"];

const STATUTS = ["Poussin", "Âge moyen", "Prêt à abattre"];

const SEUILS_PAR_DEFAUT = {
  "Poulets de chair": { joursAgeMoyen: 21, joursPretAbattre: 42 },   // 3 et 6 semaines
  "Coquelets": { joursAgeMoyen: 21, joursPretAbattre: 56 },          // 3 et 8 semaines
  "Canards": { joursAgeMoyen: 28, joursPretAbattre: 70 },            // 4 et 10 semaines
  "Pintades": { joursAgeMoyen: 42, joursPretAbattre: 98 },           // 6 et 14 semaines
  // Pondeuses : poussin jusqu'à l'entrée en ponte, « prêt à abattre » = réforme.
  "Pondeuses réforme": { joursAgeMoyen: 126, joursPretAbattre: 504 }, // 18 et 72 semaines
};

const JOURS_MAX = 3650; // dix ans : au-delà, c'est forcément une faute de frappe

const nombre = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};
const plat = (x) => (x && typeof x.toJSON === "function" ? x.toJSON() : x);

// Associe à chaque espèce ses seuils : ceux enregistrés en base s'il y en a,
// sinon les valeurs par défaut. `lignes` = lignes de la table des seuils.
function fusionnerSeuils(lignes = []) {
  const enregistres = {};
  for (const brute of lignes) {
    const l = plat(brute);
    enregistres[l.espece] = l;
  }
  const resultat = {};
  for (const espece of ESPECES) {
    const e = enregistres[espece];
    resultat[espece] = e
      ? { joursAgeMoyen: nombre(e.joursAgeMoyen), joursPretAbattre: nombre(e.joursPretAbattre), personnalise: true }
      : { ...SEUILS_PAR_DEFAUT[espece], personnalise: false };
  }
  return resultat;
}

// Renvoie un message d'erreur, ou null si les seuils sont cohérents.
function validerSeuil({ joursAgeMoyen, joursPretAbattre }) {
  // Un champ laissé vide vaudrait 0 une fois converti en nombre : on le
  // signale tel quel plutôt que de renvoyer un message trompeur.
  const vide = (x) => x === null || x === undefined || String(x).trim() === "";
  if (vide(joursAgeMoyen) || vide(joursPretAbattre)) return "Renseignez les deux âges (en jours).";

  const a = Number(joursAgeMoyen);
  const b = Number(joursPretAbattre);
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    return "Les âges doivent être des nombres entiers de jours.";
  }
  if (a < 1 || b < 1) return "Les âges doivent être d'au moins 1 jour.";
  if (a > JOURS_MAX || b > JOURS_MAX) return `Les âges ne peuvent pas dépasser ${JOURS_MAX} jours.`;
  if (a >= b) return "L'âge « prêt à abattre » doit être supérieur à l'âge « âge moyen ».";
  return null;
}

// Jours entiers écoulés entre deux dates (on compare des jours calendaires,
// pour qu'une bande entrée « aujourd'hui » ait 0 jour quelle que soit l'heure).
function joursEcoules(dateDebut, maintenant = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateDebut));
  if (!m) return null;
  const debut = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const aujourdHui = Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), maintenant.getUTCDate());
  return Math.max(0, Math.round((aujourdHui - debut) / 86400000));
}

function statutPourAge(ageJours, seuil) {
  if (ageJours >= seuil.joursPretAbattre) return "Prêt à abattre";
  if (ageJours >= seuil.joursAgeMoyen) return "Âge moyen";
  return "Poussin";
}

// Tout ce qu'il faut savoir sur l'âge et le statut d'une bande, à un instant donné.
function decrireLot(lot, seuils, maintenant = new Date()) {
  const l = plat(lot);
  const seuil = seuils[l.espece] || { ...SEUILS_PAR_DEFAUT[l.espece] };

  const ageArriveeJours = Math.max(0, Math.round(nombre(l.ageArriveeJours)));
  const joursALaFerme = joursEcoules(l.dateEntree, maintenant) ?? 0;
  const ageTotalJours = ageArriveeJours + joursALaFerme;
  const statut = statutPourAge(ageTotalJours, seuil);

  let prochainStatut = null;
  let joursAvantProchainStatut = null;
  if (statut === "Poussin") {
    prochainStatut = "Âge moyen";
    joursAvantProchainStatut = seuil.joursAgeMoyen - ageTotalJours;
  } else if (statut === "Âge moyen") {
    prochainStatut = "Prêt à abattre";
    joursAvantProchainStatut = seuil.joursPretAbattre - ageTotalJours;
  }

  return { ageArriveeJours, joursALaFerme, ageTotalJours, statut, prochainStatut, joursAvantProchainStatut };
}

module.exports = {
  ESPECES,
  STATUTS,
  SEUILS_PAR_DEFAUT,
  JOURS_MAX,
  fusionnerSeuils,
  validerSeuil,
  joursEcoules,
  statutPourAge,
  decrireLot,
};
