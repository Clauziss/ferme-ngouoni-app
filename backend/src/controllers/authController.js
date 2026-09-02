const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Utilisateur } = require("../models");

async function inscrire(req, res) {
  const { nom, email, motDePasse, role } = req.body;
  if (!nom || !email || !motDePasse) {
    return res.status(400).json({ erreur: "Nom, email et mot de passe sont requis." });
  }
  const existe = await Utilisateur.findOne({ where: { email } });
  if (existe) return res.status(409).json({ erreur: "Cet email est déjà utilisé." });

  const motDePasseHash = await bcrypt.hash(motDePasse, 10);
  const utilisateur = await Utilisateur.create({
    nom,
    email,
    motDePasseHash,
    role: role === "admin" ? "admin" : "employe",
  });
  res.status(201).json({ id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role });
}

async function connexion(req, res) {
  const { email, motDePasse } = req.body;
  const utilisateur = await Utilisateur.findOne({ where: { email } });
  if (!utilisateur) return res.status(401).json({ erreur: "Identifiants invalides." });

  const valide = await bcrypt.compare(motDePasse, utilisateur.motDePasseHash);
  if (!valide) return res.status(401).json({ erreur: "Identifiants invalides." });

  const token = jwt.sign(
    { id: utilisateur.id, nom: utilisateur.nom, role: utilisateur.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
  res.json({ token, utilisateur: { id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role } });
}

async function listerUtilisateurs(req, res) {
  const utilisateurs = await Utilisateur.findAll({
    attributes: ["id", "nom", "email", "role", "createdAt"],
    order: [["createdAt", "ASC"]],
  });
  res.json(utilisateurs);
}

async function supprimerUtilisateur(req, res) {
  if (parseInt(req.params.id, 10) === req.user.id) {
    return res.status(400).json({ erreur: "Vous ne pouvez pas supprimer votre propre compte." });
  }
  const utilisateur = await Utilisateur.findByPk(req.params.id);
  if (!utilisateur) return res.status(404).json({ erreur: "Introuvable." });
  await utilisateur.destroy();
  res.status(204).send();
}

module.exports = { inscrire, connexion, listerUtilisateurs, supprimerUtilisateur };
