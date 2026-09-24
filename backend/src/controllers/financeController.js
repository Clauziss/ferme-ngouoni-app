const { Op } = require("sequelize");
const { Lot, Vente, Depense, Paiement, Abonne, ProductionOeuf } = require("../models");
const { montantVente, resteAPayer } = require("../utils/calculMontant");
const { oeufsDepuisCartons } = require("../utils/conversionOeufs");

const SUJETS = ["Poulets de chair", "Canards", "Pintades", "Pondeuses réforme", "Coquelets"];

// Construit le filtre de dates commun à toutes les sections.
function filtreDates(req) {
  const { dateDebut, dateFin } = req.query;
  const f = {};
  if (dateDebut) f[Op.gte] = dateDebut;
  if (dateFin) f[Op.lte] = dateFin;
  return Object.keys(f).length ? { date: f } : {};
}

function joursEcoules(dateISO) {
  const diff = Date.now() - new Date(dateISO).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

// ---------------------------------------------------------------------------
// 1. TRÉSORERIE ET IMPAYÉS
// ---------------------------------------------------------------------------
async function tresorerie(req, res) {
  const dateWhere = filtreDates(req);

  const [paiements, depenses, ventes] = await Promise.all([
    Paiement.findAll({ where: dateWhere }),
    Depense.findAll({ where: dateWhere }),
    Vente.findAll({ include: [{ model: Abonne, as: "client" }] }),
  ]);

  const totalEncaisse = paiements.reduce((s, p) => s + p.montantFcfa, 0);
  const totalDecaisse = depenses.reduce((s, d) => s + d.montantFcfa, 0);

  // Les créances sont une photo à l'instant présent : on ne les filtre pas
  // par période, sinon on masquerait de vieux impayés toujours dus.
  const impayes = ventes
    .filter((v) => resteAPayer(v) > 0)
    .map((v) => ({
      venteId: v.id,
      date: v.date,
      client: v.client ? v.client.nom : "Occasionnel",
      sujet: v.sujet,
      typeProduit: v.typeProduit,
      montantTotalFcfa: montantVente(v),
      montantEncaisseFcfa: v.montantEncaisseFcfa || 0,
      resteAPayerFcfa: resteAPayer(v),
      anciennete: joursEcoules(v.date),
    }))
    .sort((a, b) => b.anciennete - a.anciennete);

  const creancesTotal = impayes.reduce((s, i) => s + i.resteAPayerFcfa, 0);

  // Regroupement des créances par client
  const parClient = {};
  impayes.forEach((i) => {
    if (!parClient[i.client]) parClient[i.client] = { client: i.client, nbVentes: 0, montantFcfa: 0, plusAncien: 0 };
    parClient[i.client].nbVentes += 1;
    parClient[i.client].montantFcfa += i.resteAPayerFcfa;
    parClient[i.client].plusAncien = Math.max(parClient[i.client].plusAncien, i.anciennete);
  });

  res.json({
    totalEncaisse,
    totalDecaisse,
    soldeTresorerie: totalEncaisse - totalDecaisse,
    creancesTotal,
    nbImpayes: impayes.length,
    creancesParClient: Object.values(parClient).sort((a, b) => b.montantFcfa - a.montantFcfa),
    impayes,
  });
}

// ---------------------------------------------------------------------------
// 2. COÛT DE REVIENT
// ---------------------------------------------------------------------------
async function coutRevient(req, res) {
  const dateWhere = filtreDates(req);

  const [lots, depenses, ventes, productionOeufs] = await Promise.all([
    Lot.findAll(),
    Depense.findAll({ where: dateWhere }),
    Vente.findAll({ where: dateWhere }),
    ProductionOeuf.findAll({ where: dateWhere }),
  ]);

  // Coût par sujet vivant : dépenses du poulailler / effectif actuel
  const parSujet = SUJETS.map((sujet) => {
    const effectif = lots
      .filter((l) => l.espece === sujet)
      .reduce((s, l) => s + (l.effectifInitial - l.mortaliteCumulee), 0);

    const chargesFcfa = depenses
      .filter((d) => d.poulailler === sujet)
      .reduce((s, d) => s + d.montantFcfa, 0);

    const ventesSujet = ventes.filter(
      (v) => v.sujet === sujet && v.typeProduit !== "Oeufs"
    );
    const quantiteVendue = ventesSujet.reduce((s, v) => s + (v.quantite || 0), 0);
    const chiffreAffaires = ventesSujet.reduce((s, v) => s + montantVente(v), 0);

    const coutUnitaire = effectif > 0 ? chargesFcfa / effectif : null;
    const prixVenteMoyen = quantiteVendue > 0 ? chiffreAffaires / quantiteVendue : null;

    return {
      sujet,
      effectif,
      chargesFcfa,
      coutUnitaire,
      quantiteVendue,
      prixVenteMoyen,
      margeUnitaire:
        coutUnitaire != null && prixVenteMoyen != null ? prixVenteMoyen - coutUnitaire : null,
    };
  });

  // Coût par carton d'œufs : charges du poulailler pondeuses / cartons produits
  const chargesPondeuses = depenses
    .filter((d) => d.poulailler === "Pondeuses réforme")
    .reduce((s, d) => s + d.montantFcfa, 0);

  const cartonsProduits = productionOeufs.reduce(
    (s, p) => s + p.productionCartons + p.productionPalettes / 12,
    0
  );

  const ventesOeufs = ventes.filter((v) => v.typeProduit === "Oeufs");
  // On ramène tout en cartons pour comparer ce qui est comparable.
  const cartonsVendus = ventesOeufs.reduce(
    (s, v) => s + (v.sousTypeOeufs === "En détail" ? (v.quantite || 0) / 12 : v.quantite || 0),
    0
  );
  const caOeufs = ventesOeufs.reduce((s, v) => s + montantVente(v), 0);

  const oeufs = {
    chargesFcfa: chargesPondeuses,
    cartonsProduits,
    oeufsProduits: productionOeufs.reduce(
      (s, p) => s + oeufsDepuisCartons(p.productionCartons, p.productionPalettes),
      0
    ),
    coutParCarton: cartonsProduits > 0 ? chargesPondeuses / cartonsProduits : null,
    coutParOeuf: cartonsProduits > 0 ? chargesPondeuses / (cartonsProduits * 360) : null,
    cartonsVendus,
    prixVenteMoyenCarton: cartonsVendus > 0 ? caOeufs / cartonsVendus : null,
  };
  oeufs.margeParCarton =
    oeufs.coutParCarton != null && oeufs.prixVenteMoyenCarton != null
      ? oeufs.prixVenteMoyenCarton - oeufs.coutParCarton
      : null;

  res.json({ parSujet, oeufs });
}

// ---------------------------------------------------------------------------
// 3. COMPTE DE RÉSULTAT
// ---------------------------------------------------------------------------
async function compteResultat(req, res) {
  const dateWhere = filtreDates(req);

  const [ventes, depenses] = await Promise.all([
    Vente.findAll({ where: dateWhere }),
    Depense.findAll({ where: dateWhere }),
  ]);

  const produitsParType = {};
  let totalProduits = 0;
  ventes.forEach((v) => {
    const m = montantVente(v);
    totalProduits += m;
    const cle = v.typeProduit === "Oeufs" ? `Œufs (${v.sousTypeOeufs || "—"})` : v.typeProduit;
    produitsParType[cle] = (produitsParType[cle] || 0) + m;
  });

  const chargesParCategorie = {};
  let totalCharges = 0;
  depenses.forEach((d) => {
    totalCharges += d.montantFcfa;
    chargesParCategorie[d.categorie] = (chargesParCategorie[d.categorie] || 0) + d.montantFcfa;
  });

  const resultat = totalProduits - totalCharges;

  res.json({
    produits: {
      total: totalProduits,
      parType: Object.entries(produitsParType)
        .map(([libelle, montant]) => ({ libelle, montant }))
        .sort((a, b) => b.montant - a.montant),
    },
    charges: {
      total: totalCharges,
      parCategorie: Object.entries(chargesParCategorie)
        .map(([libelle, montant]) => ({ libelle, montant }))
        .sort((a, b) => b.montant - a.montant),
    },
    resultat,
    tauxMarge: totalProduits > 0 ? resultat / totalProduits : null,
  });
}

// ---------------------------------------------------------------------------
// 4. SEUIL DE RENTABILITÉ
// ---------------------------------------------------------------------------
// Approche volontairement simple : on compare les charges de la période au
// chiffre d'affaires et aux prix de vente moyens constatés, pour répondre à
// « combien dois-je vendre pour couvrir mes charges ? ».
async function seuilRentabilite(req, res) {
  const dateWhere = filtreDates(req);

  const [ventes, depenses] = await Promise.all([
    Vente.findAll({ where: dateWhere }),
    Depense.findAll({ where: dateWhere }),
  ]);

  const totalCharges = depenses.reduce((s, d) => s + d.montantFcfa, 0);
  const totalProduits = ventes.reduce((s, v) => s + montantVente(v), 0);
  const ecart = totalProduits - totalCharges;

  // Prix de vente moyen constaté, par famille de produit
  function moyennePour(filtre, convertirEnCartons = false) {
    const lot = ventes.filter(filtre);
    const qte = lot.reduce(
      (s, v) =>
        s + (convertirEnCartons && v.sousTypeOeufs === "En détail" ? (v.quantite || 0) / 12 : v.quantite || 0),
      0
    );
    const ca = lot.reduce((s, v) => s + montantVente(v), 0);
    return qte > 0 ? { prixMoyen: ca / qte, quantite: qte, ca } : null;
  }

  const familles = [
    {
      libelle: "Volaille vivante (par sujet)",
      stat: moyennePour((v) => v.typeProduit === "Volaille vivante"),
      unite: "sujet(s)",
    },
    {
      libelle: "Volaille effilée (par kg)",
      stat: moyennePour((v) => v.typeProduit === "Volaille effilée"),
      unite: "kg",
    },
    {
      libelle: "Œufs (par carton)",
      stat: moyennePour((v) => v.typeProduit === "Oeufs", true),
      unite: "carton(s)",
    },
  ].map((f) => ({
    libelle: f.libelle,
    unite: f.unite,
    prixMoyen: f.stat ? f.stat.prixMoyen : null,
    quantiteVendue: f.stat ? f.stat.quantite : null,
    // Quantité qu'il faudrait vendre, dans cette seule famille, pour couvrir
    // l'intégralité des charges de la période.
    quantitePourCouvrirCharges:
      f.stat && f.stat.prixMoyen > 0 ? totalCharges / f.stat.prixMoyen : null,
  }));

  // Projection simple : à rythme constant, où en sera-t-on en fin de mois ?
  const { dateDebut, dateFin } = req.query;
  let projection = null;
  if (dateDebut && dateFin) {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const jours = Math.max(1, Math.round((fin - debut) / (1000 * 60 * 60 * 24)) + 1);
    projection = {
      jours,
      produitsParJour: totalProduits / jours,
      chargesParJour: totalCharges / jours,
      resultatParJour: ecart / jours,
      projection30Jours: (ecart / jours) * 30,
    };
  }

  res.json({
    totalProduits,
    totalCharges,
    ecart,
    couvert: ecart >= 0,
    tauxCouverture: totalCharges > 0 ? totalProduits / totalCharges : null,
    familles,
    projection,
  });
}

module.exports = { tresorerie, coutRevient, compteResultat, seuilRentabilite };
