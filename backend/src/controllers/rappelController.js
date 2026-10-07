const { Op } = require("sequelize");
const { Rappel, Lot, Vente, Abonne } = require("../models");
const { montantVente, resteAPayer } = require("../utils/calculMontant");

// Une vente liée est renvoyée avec son reste à payer calculé, pour que le
// frontend puisse afficher directement le montant dû.
const inclusions = [
  Lot,
  { model: Vente, include: [{ model: Abonne, as: "client" }] },
];

function enrichir(rappel) {
  const brut = rappel.toJSON();
  if (brut.Vente) {
    brut.Vente.montantTotalFcfa = montantVente(brut.Vente);
    brut.Vente.resteAPayerFcfa = resteAPayer(brut.Vente);
  }
  return brut;
}

async function list(req, res) {
  const rappels = await Rappel.findAll({ include: inclusions, order: [["datePrevue", "ASC"]] });
  res.json(rappels.map(enrichir));
}

// Rappels dus aujourd'hui ou en retard, non traités — pour la clochette de notifications
async function dus(req, res) {
  const aujourdHui = new Date().toISOString().slice(0, 10);
  const rappels = await Rappel.findAll({
    where: { statut: "À faire", datePrevue: { [Op.lte]: aujourdHui } },
    include: inclusions,
    order: [["datePrevue", "ASC"]],
  });
  res.json(rappels.map(enrichir));
}

async function create(req, res) {
  try {
    const rappel = await Rappel.create({ ...req.body, creePar: req.user.id });
    res.status(201).json(rappel);
  } catch (err) {
    res.status(400).json({ erreur: err.message });
  }
}

async function marquerFait(req, res) {
  const rappel = await Rappel.findByPk(req.params.id);
  if (!rappel) return res.status(404).json({ erreur: "Introuvable." });
  await rappel.update({ statut: "Fait" });
  res.json(rappel);
}

async function remove(req, res) {
  const rappel = await Rappel.findByPk(req.params.id);
  if (!rappel) return res.status(404).json({ erreur: "Introuvable." });
  await rappel.destroy();
  res.status(204).send();
}

module.exports = { list, dus, create, marquerFait, remove };
