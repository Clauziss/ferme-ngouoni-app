const { Op } = require("sequelize");
const { Lot, Vente, Depense, ProductionOeuf, ProductionChair } = require("../models");
const { montantVente, resteAPayer } = require("../utils/calculMontant");
const { oeufsDepuisCartons } = require("../utils/conversionOeufs");

const SUJETS = ["Poulets de chair", "Canards", "Pintades", "Pondeuses réforme", "Coquelets"];
const TYPES_PRODUIT = ["Volaille vivante", "Volaille effilée", "Oeufs"];

// Dépenses par poulailler + ventes par type de produit + ventes œufs par
// en gros / en détail + ventes par sujet + marge globale + encaissements.
async function rentabiliteParLot(req, res) {
  const [ventes, depenses] = await Promise.all([Vente.findAll(), Depense.findAll()]);

  const totalVentesFcfa = ventes.reduce((s, v) => s + montantVente(v), 0);
  const totalEncaisseFcfa = ventes.reduce((s, v) => s + (v.montantEncaisseFcfa || 0), 0);
  const totalResteAPayerFcfa = ventes.reduce((s, v) => s + resteAPayer(v), 0);
  const totalDepensesFcfa = depenses.reduce((s, d) => s + d.montantFcfa, 0);

  const depensesParPoulailler = SUJETS.concat("Ferme").map((poulailler) => ({
    poulailler,
    totalDepensesFcfa: depenses
      .filter((d) => d.poulailler === poulailler)
      .reduce((s, d) => s + d.montantFcfa, 0),
  }));

  const ventesParType = TYPES_PRODUIT.map((type) => ({
    typeProduit: type,
    totalVentesFcfa: ventes.filter((v) => v.typeProduit === type).reduce((s, v) => s + montantVente(v), 0),
  }));

  const ventesOeufs = ventes.filter((v) => v.typeProduit === "Oeufs");
  const ventesOeufsParSousType = ["En gros", "En détail"].map((sousType) => ({
    sousType,
    totalVentesFcfa: ventesOeufs
      .filter((v) => v.sousTypeOeufs === sousType)
      .reduce((s, v) => s + montantVente(v), 0),
  }));

  const ventesParSujet = SUJETS.map((sujet) => ({
    sujet,
    totalVentesFcfa: ventes.filter((v) => v.sujet === sujet).reduce((s, v) => s + montantVente(v), 0),
  }));

  res.json({
    totalVentesFcfa,
    totalEncaisseFcfa,
    totalResteAPayerFcfa,
    totalDepensesFcfa,
    margeFcfa: totalVentesFcfa - totalDepensesFcfa,
    depensesParPoulailler,
    ventesParType,
    ventesOeufsParSousType,
    ventesParSujet,
  });
}

// Taux de ponte : œufs produits / effectif de pondeuses, en moyenne par jour
// sur les 30 derniers jours, comparé au seuil configuré.
async function alerteReforme(req, res) {
  const seuil = parseFloat(process.env.SEUIL_REFORME_PONTE || "0.5");
  const ilYa30Jours = new Date();
  ilYa30Jours.setDate(ilYa30Jours.getDate() - 30);

  const [lotsPondeuses, entrees] = await Promise.all([
    Lot.findAll({ where: { espece: "Pondeuses réforme" } }),
    ProductionOeuf.findAll({ where: { date: { [Op.gte]: ilYa30Jours } } }),
  ]);

  const effectifTotal = lotsPondeuses.reduce((s, l) => s + (l.effectifInitial - l.mortaliteCumulee), 0);

  if (entrees.length === 0 || effectifTotal === 0) {
    return res.json({ seuil, effectifTotal, tauxPonteMoyen: null, statut: "Pas encore de données" });
  }

  const tauxPonteMoyen =
    entrees.reduce(
      (s, e) => s + oeufsDepuisCartons(e.productionCartons, e.productionPalettes) / effectifTotal,
      0
    ) / entrees.length;

  res.json({
    seuil,
    effectifTotal,
    tauxPonteMoyen,
    statut: tauxPonteMoyen < seuil ? "À surveiller" : "OK",
  });
}

// Tendance des 30 derniers jours : ventes et dépenses par jour.
async function tendance30Jours(req, res) {
  const ilYa30Jours = new Date();
  ilYa30Jours.setDate(ilYa30Jours.getDate() - 29);
  const debut = ilYa30Jours.toISOString().slice(0, 10);

  const [ventes, depenses] = await Promise.all([
    Vente.findAll({ where: { date: { [Op.gte]: debut } } }),
    Depense.findAll({ where: { date: { [Op.gte]: debut } } }),
  ]);

  const parJour = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(ilYa30Jours);
    d.setDate(d.getDate() + i);
    const cle = d.toISOString().slice(0, 10);
    parJour[cle] = { date: cle, ventesFcfa: 0, depensesFcfa: 0 };
  }
  ventes.forEach((v) => {
    if (parJour[v.date]) parJour[v.date].ventesFcfa += montantVente(v);
  });
  depenses.forEach((d) => {
    if (parJour[d.date]) parJour[d.date].depensesFcfa += d.montantFcfa;
  });

  res.json(Object.values(parJour));
}

// Analyse filtrable par type d'animal et période.
async function analyse(req, res) {
  const { espece, dateDebut, dateFin } = req.query;

  const filtreLots = {};
  if (espece) filtreLots.espece = espece;
  const lots = await Lot.findAll({
    where: filtreLots,
    order: [["espece", "ASC"], ["dateEntree", "ASC"]],
  });

  const filtreDate = {};
  if (dateDebut) filtreDate[Op.gte] = dateDebut;
  if (dateFin) filtreDate[Op.lte] = dateFin;
  const dateWhere = Object.keys(filtreDate).length ? { date: filtreDate } : {};

  const lotsResume = lots.map((l) => {
    const effectifActuel = l.effectifInitial - l.mortaliteCumulee;
    return {
      espece: l.espece,
      statut: l.statut,
      dateEntree: l.dateEntree,
      effectifInitial: l.effectifInitial,
      mortaliteCumulee: l.mortaliteCumulee,
      effectifActuel,
      tauxMortalite: l.effectifInitial > 0 ? l.mortaliteCumulee / l.effectifInitial : 0,
    };
  });

  const [productionOeufs, productionChair, ventes, depenses] = await Promise.all([
    ProductionOeuf.findAll({ where: dateWhere }),
    ProductionChair.findAll({ where: { ...(espece ? { sujet: espece } : {}), ...dateWhere } }),
    Vente.findAll({ where: { ...(espece ? { sujet: espece } : {}), ...dateWhere } }),
    Depense.findAll({ where: { ...(espece ? { poulailler: espece } : {}), ...dateWhere } }),
  ]);

  const totalProductionCartons = productionOeufs.reduce(
    (s, p) => s + p.productionCartons + p.productionPalettes / 12,
    0
  );
  const totalProductionOeufs = productionOeufs.reduce(
    (s, p) => s + oeufsDepuisCartons(p.productionCartons, p.productionPalettes),
    0
  );
  const totalCassesNombre = productionOeufs.reduce((s, p) => s + p.cassesNombre, 0);
  const tauxCasse = totalProductionOeufs > 0 ? totalCassesNombre / totalProductionOeufs : null;

  const poidsMoyenChair = productionChair.length
    ? productionChair.reduce((s, p) => s + p.poidsMoyenKg, 0) / productionChair.length
    : null;

  const ventesParType = {};
  let totalVentesFcfa = 0;
  let totalEncaisseFcfa = 0;
  ventes.forEach((v) => {
    const montant = montantVente(v);
    totalVentesFcfa += montant;
    totalEncaisseFcfa += v.montantEncaisseFcfa || 0;
    ventesParType[v.typeProduit] = (ventesParType[v.typeProduit] || 0) + montant;
  });

  const depensesParCategorie = {};
  let totalDepensesFcfa = 0;
  depenses.forEach((d) => {
    totalDepensesFcfa += d.montantFcfa;
    depensesParCategorie[d.categorie] = (depensesParCategorie[d.categorie] || 0) + d.montantFcfa;
  });

  res.json({
    lots: lotsResume,
    production: {
      oeufs: { totalProductionCartons, totalCassesNombre, tauxCasse },
      chair: { poidsMoyenKg: poidsMoyenChair, nbPesees: productionChair.length },
    },
    ventes: {
      totalFcfa: totalVentesFcfa,
      totalEncaisseFcfa,
      resteAPayerFcfa: totalVentesFcfa - totalEncaisseFcfa,
      parType: ventesParType,
    },
    depenses: { totalFcfa: totalDepensesFcfa, parCategorie: depensesParCategorie },
    margeFcfa: totalVentesFcfa - totalDepensesFcfa,
  });
}

module.exports = { rentabiliteParLot, alerteReforme, tendance30Jours, analyse };
