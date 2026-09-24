const { Op } = require("sequelize");
const { Vente, Depense, Abonne } = require("../models");
const { montantVente, resteAPayer } = require("../utils/calculMontant");

function libelleVente(v) {
  const produit =
    v.typeProduit === "Oeufs" ? `Œufs (${v.sousTypeOeufs || "—"})` : v.typeProduit;
  return `${v.sujet} — ${produit}`;
}

function uniteVente(v) {
  if (v.typeProduit === "Volaille vivante") return "sujet(s)";
  if (v.typeProduit === "Volaille effilée") return "kg";
  if (v.sousTypeOeufs === "En gros") return "carton(s)";
  if (v.sousTypeOeufs === "En détail") return "palette(s)";
  return "";
}

// Relevé de mouvements : ventes et/ou dépenses sur une période, avec
// regroupement par jour ou par mois et totaux.
async function releve(req, res) {
  const { dateDebut, dateFin, type = "tout", clientId, regroupement = "jour" } = req.query;

  const f = {};
  if (dateDebut) f[Op.gte] = dateDebut;
  if (dateFin) f[Op.lte] = dateFin;
  const dateWhere = Object.keys(f).length ? { date: f } : {};

  const veutVentes = type === "tout" || type === "ventes";
  const veutDepenses = type === "tout" || type === "depenses";

  const filtreVentes = { ...dateWhere };
  if (clientId === "occasionnel") filtreVentes.clientId = null;
  else if (clientId) filtreVentes.clientId = clientId;

  const [ventes, depenses] = await Promise.all([
    veutVentes
      ? Vente.findAll({ where: filtreVentes, include: [{ model: Abonne, as: "client" }] })
      : [],
    // Les dépenses ne concernent aucun client : on les écarte si un client
    // précis est demandé, sinon le relevé serait trompeur.
    veutDepenses && !clientId ? Depense.findAll({ where: dateWhere }) : [],
  ]);

  const mouvements = [
    ...ventes.map((v) => ({
      sens: "Entrée",
      date: v.date,
      categorie: "Vente",
      libelle: libelleVente(v),
      client: v.client ? v.client.nom : "Occasionnel",
      detail: `${v.quantite} ${uniteVente(v)} × ${Math.round(v.prixUnitaireFcfa).toLocaleString("fr-FR")} FCFA`,
      montantFcfa: montantVente(v),
      encaisseFcfa: v.montantEncaisseFcfa || 0,
      resteFcfa: resteAPayer(v),
      observations: v.observations || "",
    })),
    ...depenses.map((d) => ({
      sens: "Sortie",
      date: d.date,
      categorie: d.categorie,
      libelle: `${d.poulailler} — ${d.categorie}`,
      client: "",
      detail: d.description || "",
      montantFcfa: d.montantFcfa,
      encaisseFcfa: null,
      resteFcfa: null,
      observations: "",
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  // Regroupement par jour (AAAA-MM-JJ) ou par mois (AAAA-MM)
  const cleDe = (d) => (regroupement === "mois" ? d.slice(0, 7) : d);
  const groupes = {};
  mouvements.forEach((m) => {
    const cle = cleDe(m.date);
    if (!groupes[cle]) groupes[cle] = { periode: cle, entrees: 0, sorties: 0, mouvements: [] };
    if (m.sens === "Entrée") groupes[cle].entrees += m.montantFcfa;
    else groupes[cle].sorties += m.montantFcfa;
    groupes[cle].mouvements.push(m);
  });

  const listeGroupes = Object.values(groupes)
    .map((g) => ({ ...g, solde: g.entrees - g.sorties }))
    .sort((a, b) => a.periode.localeCompare(b.periode));

  const totalEntrees = mouvements
    .filter((m) => m.sens === "Entrée")
    .reduce((s, m) => s + m.montantFcfa, 0);
  const totalSorties = mouvements
    .filter((m) => m.sens === "Sortie")
    .reduce((s, m) => s + m.montantFcfa, 0);
  const totalEncaisse = ventes.reduce((s, v) => s + (v.montantEncaisseFcfa || 0), 0);
  const totalReste = ventes.reduce((s, v) => s + resteAPayer(v), 0);

  res.json({
    totaux: {
      entrees: totalEntrees,
      sorties: totalSorties,
      solde: totalEntrees - totalSorties,
      encaisse: totalEncaisse,
      resteAPayer: totalReste,
      nbMouvements: mouvements.length,
    },
    groupes: listeGroupes,
  });
}

module.exports = { releve };
