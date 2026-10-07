const { ESPECES, SEUILS_PAR_DEFAUT, validerSeuil } = require("../utils/statuts");
const { chargerSeuils } = require("../utils/seuils");

const modeles = () => require("../models");

async function reponse() {
  const seuils = await chargerSeuils();
  return ESPECES.map((espece) => ({
    espece,
    joursAgeMoyen: seuils[espece].joursAgeMoyen,
    joursPretAbattre: seuils[espece].joursPretAbattre,
    personnalise: seuils[espece].personnalise,
    defaut: SEUILS_PAR_DEFAUT[espece],
  }));
}

// Seuils actuels de chaque espèce (ouvert à tout utilisateur connecté).
async function lister(req, res) {
  res.json(await reponse());
}

// Enregistre les seuils (administrateur uniquement). Tout est vérifié avant
// la moindre écriture : un seul seuil invalide et rien n'est modifié.
async function enregistrer(req, res) {
  const { seuils } = req.body || {};
  if (!Array.isArray(seuils) || seuils.length === 0) {
    return res.status(400).json({ erreur: "Aucun seuil reçu." });
  }

  const propres = [];
  for (const s of seuils) {
    if (!ESPECES.includes(s.espece)) {
      return res.status(400).json({ erreur: `Type d'animal inconnu : ${s.espece}.` });
    }
    const probleme = validerSeuil(s);
    if (probleme) return res.status(400).json({ erreur: `${s.espece} : ${probleme}` });
    propres.push({
      espece: s.espece,
      joursAgeMoyen: Number(s.joursAgeMoyen),
      joursPretAbattre: Number(s.joursPretAbattre),
    });
  }

  const { SeuilStatut } = modeles();
  for (const p of propres) await SeuilStatut.upsert(p);
  res.json(await reponse());
}

module.exports = { lister, enregistrer };
