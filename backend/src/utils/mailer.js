const nodemailer = require("nodemailer");

let transporteur = null;

function getTransporteur() {
  if (!process.env.SMTP_HOST) return null; // e-mails désactivés si pas configuré
  if (!transporteur) {
    transporteur = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporteur;
}

async function envoyerEmail(destinataires, sujet, html) {
  const t = getTransporteur();
  if (!t || !destinataires || destinataires.length === 0) return;
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || "Ferme de Ngouoni <notifications@ferme-ngouoni.local>",
      to: destinataires.join(","),
      subject: sujet,
      html,
    });
  } catch (err) {
    console.error("[Email] Échec d'envoi :", err.message);
  }
}

module.exports = { envoyerEmail };
