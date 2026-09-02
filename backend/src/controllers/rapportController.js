const { Op } = require("sequelize");
const { Abonne, Vente } = require("../models");
const { montantVente, resteAPayer } = require("../utils/calculMontant");

// Déduit une fréquence d'achat à partir des dates réelles des ventes.
function calculerFrequence(dates) {
  if (dates.length < 2) return dates.length === 1 ? "Achat unique" : "—";

  const tries = dates.map((d) => new Date(d)).sort((a, b) => a - b);
  const joursTotal = (tries[tries.length - 1] - tries[0]) / (1000 * 60 * 60 * 24);
  const intervalleMoyen = joursTotal / (tries.length - 1);

  if (intervalleMoyen <= 10) return "Hebdomadaire";
  if (intervalleMoyen <= 20) return "Bi-mensuelle";
  if (intervalleMoyen <= 45) return "Mensuelle";
  return "Occasionnelle";
}

function detailAchat(v) {
  return {
    date: v.date,
    sujet: v.sujet,
    typeProduit: v.typeProduit,
    sousTypeOeufs: v.sousTypeOeufs,
    quantite: v.quantite,
    prixUnitaireFcfa: v.prixUnitaireFcfa,
    montantFcfa: montantVente(v),
    montantEncaisseFcfa: v.montantEncaisseFcfa || 0,
    resteAPayerFcfa: resteAPayer(v),
    observations: v.observations,
  };
}

function resumerClient(nom, ville, contacts, achats, estOccasionnel) {
  const montantTotal = achats.reduce((s, a) => s + montantVente(a), 0);
  const montantEncaisse = achats.reduce((s, a) => s + (a.montantEncaisseFcfa || 0), 0);
  return {
    id: estOccasionnel ? "occasionnel" : undefined,
    nom,
    ville,
    contacts,
    estOccasionnel,
    nbCommandes: achats.length,
    montantTotal,
    montantEncaisse,
    resteAPayer: montantTotal - montantEncaisse,
    frequence: calculerFrequence(achats.map((a) => a.date)),
    achats: achats.map(detailAchat),
  };
}

// Liste des clients (abonnés + ventes occasionnelles regroupées) avec leurs
// achats sur une période donnée — utilisé pour le rapport imprimable.
async function rapportClients(req, res) {
  const { dateDebut, dateFin } = req.query;
  const filtreDate = {};
  if (dateDebut) filtreDate[Op.gte] = dateDebut;
  if (dateFin) filtreDate[Op.lte] = dateFin;
  const dateWhere = Object.keys(filtreDate).length ? { date: filtreDate } : {};

  const abonnes = await Abonne.findAll({ order: [["nom", "ASC"]] });

  const resultats = await Promise.all(
    abonnes.map(async (client) => {
      const achats = await Vente.findAll({
        where: { clientId: client.id, ...dateWhere },
        order: [["date", "ASC"]],
      });
      const resume = resumerClient(client.nom, client.ville, client.contacts, achats, false);
      resume.id = client.id;
      return resume;
    })
  );

  // Ventes sans abonné rattaché : regroupées sous "Occasionnel".
  const ventesOccasionnelles = await Vente.findAll({
    where: { clientId: null, ...dateWhere },
    order: [["date", "ASC"]],
  });

  const liste = resultats.filter((r) => r.nbCommandes > 0 || !dateDebut);
  if (ventesOccasionnelles.length > 0) {
    liste.push(resumerClient("Occasionnel", "—", "—", ventesOccasionnelles, true));
  }

  res.json(liste);
}

// Ventes dont le montant encaissé est inférieur au total — utilisé pour
// proposer une liste de ventes à relancer lors de la création d'un rappel.
async function ventesNonSoldees(req, res) {
  const ventes = await Vente.findAll({
    include: [{ model: Abonne, as: "client" }],
    order: [["date", "ASC"]],
  });

  const nonSoldees = ventes
    .filter((v) => resteAPayer(v) > 0)
    .map((v) => ({
      id: v.id,
      date: v.date,
      client: v.client ? v.client.nom : "Occasionnel",
      sujet: v.sujet,
      typeProduit: v.typeProduit,
      montantTotalFcfa: montantVente(v),
      montantEncaisseFcfa: v.montantEncaisseFcfa || 0,
      resteAPayerFcfa: resteAPayer(v),
      // Libellé prêt à afficher dans une liste déroulante
      libelle: `${v.date} — ${v.client ? v.client.nom : "Occasionnel"} — reste ${Math.round(resteAPayer(v)).toLocaleString("fr-FR")} FCFA`,
    }));

  res.json(nonSoldees);
}

module.exports = { rapportClients, ventesNonSoldees };
