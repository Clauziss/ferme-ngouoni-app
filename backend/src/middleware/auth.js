const jwt = require("jsonwebtoken");

// Durée d'une session sans activité (minutes). Chaque requête authentifiée renouvelle le jeton :
// au bout de ce délai sans aucune requête, le jeton expire et il faut ressaisir le mot de passe.
const MINUTES_SESSION = Math.max(1, parseInt(process.env.SESSION_MINUTES, 10) || 10);

function signerJeton(utilisateur) {
  return jwt.sign(
    { id: utilisateur.id, nom: utilisateur.nom, role: utilisateur.role },
    process.env.JWT_SECRET,
    { expiresIn: `${MINUTES_SESSION}m` }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ erreur: "Authentification requise." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, nom }
    res.setHeader("X-Nouveau-Token", signerJeton(payload)); // session glissante
    next();
  } catch (err) {
    return res.status(401).json({ erreur: "Session invalide ou expirée." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ erreur: "Accès refusé pour ce rôle." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole, signerJeton, MINUTES_SESSION };
