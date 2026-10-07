const { sequelize, Vente, Paiement, Abonne } = require("../models");
const { montantVente, resteAPayer } = require("../utils/calculMontant");

// Liste des versements d'une vente, avec le rappel du solde.
async function listerPourVente(req, res) {
  const vente = await Vente.findByPk(req.params.id, {
    include: [{ model: Abonne, as: "client" }, Paiement],
  });
  if (!vente) return res.status(404).json({ erreur: "Vente introuvable." });

  const paiements = (vente.Paiements || []).sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    vente: {
      id: vente.id,
      date: vente.date,
      client: vente.client ? vente.client.nom : "Occasionnel",
      sujet: vente.sujet,
      typeProduit: vente.typeProduit,
      sousTypeOeufs: vente.sousTypeOeufs,
      montantTotalFcfa: montantVente(vente),
      montantEncaisseFcfa: vente.montantEncaisseFcfa || 0,
      resteAPayerFcfa: resteAPayer(vente),
    },
    paiements: paiements.map((p) => ({
      id: p.id,
      date: p.date,
      montantFcfa: p.montantFcfa,
      observations: p.observations,
    })),
  });
}

// Ajoute un versement complémentaire sur une vente non soldée.
async function ajouter(req, res) {
  const { date, montantFcfa, observations } = req.body;
  const montant = parseFloat(montantFcfa);

  if (!date) return res.status(400).json({ erreur: "La date du versement est requise." });
  if (!Number.isFinite(montant) || montant <= 0) {
    return res.status(400).json({ erreur: "Le montant doit être supérieur à zéro." });
  }

  const transaction = await sequelize.transaction();
  try {
    const vente = await Vente.findByPk(req.params.id, { transaction });
    if (!vente) {
      await transaction.rollback();
      return res.status(404).json({ erreur: "Vente introuvable." });
    }

    const restant = resteAPayer(vente);
    if (restant <= 0) {
      await transaction.rollback();
      return res.status(400).json({ erreur: "Cette vente est déjà soldée." });
    }
    if (montant > restant) {
      await transaction.rollback();
      return res.status(400).json({
        erreur: `Le montant dépasse le reste à payer (${Math.round(restant).toLocaleString("fr-FR")} FCFA).`,
      });
    }

    await Paiement.create(
      { venteId: vente.id, date, montantFcfa: montant, observations },
      { transaction }
    );
    await vente.update(
      { montantEncaisseFcfa: (vente.montantEncaisseFcfa || 0) + montant },
      { transaction }
    );

    await transaction.commit();

    const rafraichie = await Vente.findByPk(vente.id);
    res.status(201).json({
      message: "Versement enregistré.",
      montantEncaisseFcfa: rafraichie.montantEncaisseFcfa,
      resteAPayerFcfa: resteAPayer(rafraichie),
    });
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ erreur: err.message });
  }
}

module.exports = { listerPourVente, ajouter };
