const cron = require("node-cron");
const { Op } = require("sequelize");
const { Rappel, Lot, Utilisateur } = require("../models");
const { envoyerEmail } = require("../utils/mailer");

// Tous les jours à 6h : vérifie les rappels dus et envoie un e-mail récapitulatif
// aux administrateurs. Si SMTP n'est pas configuré (.env), l'envoi est simplement ignoré
// et seule la clochette dans l'appli (endpoint /api/rappels/dus) reste active.
function demarrerRappelsCron() {
  cron.schedule("0 6 * * *", async () => {
    const aujourdHui = new Date().toISOString().slice(0, 10);
    const rappelsDus = await Rappel.findAll({
      where: { statut: "À faire", datePrevue: { [Op.lte]: aujourdHui } },
      include: [Lot],
      order: [["datePrevue", "ASC"]],
    });
    if (rappelsDus.length === 0) return;

    console.log(`[Rappels] ${rappelsDus.length} rappel(s) en attente aujourd'hui.`);

    const admins = await Utilisateur.findAll({ where: { role: "admin" } });
    const destinataires = admins.map((a) => a.email).filter(Boolean);
    if (destinataires.length === 0) return;

    const lignes = rappelsDus
      .map((r) => `<li><strong>${r.titre}</strong> (${r.type})${r.Lot ? ` — Volaille : ${r.Lot.espece}` : ""} — prévu le ${r.datePrevue}</li>`)
      .join("");
    const html = `
      <h2>Ferme de Ngouoni — Rappels à traiter</h2>
      <p>${rappelsDus.length} rappel(s) sont dus ou en retard :</p>
      <ul>${lignes}</ul>
    `;
    await envoyerEmail(destinataires, `Ferme de Ngouoni — ${rappelsDus.length} rappel(s) à traiter`, html);
  });
}

module.exports = demarrerRappelsCron;
