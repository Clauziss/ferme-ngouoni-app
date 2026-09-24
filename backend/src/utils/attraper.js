// Express (v4) n'intercepte pas les erreurs des fonctions "async" : une requête
// qui échoue produit alors une promesse rejetée non gérée, et Node arrête tout
// le processus — le serveur meurt et toutes les requêtes en cours échouent
// (ce qui se manifeste côté navigateur par des erreurs CORS trompeuses).
//
// Ce petit emballage attrape l'erreur et la transmet au gestionnaire global
// d'Express, qui répond proprement en JSON. Le serveur reste debout.
function attraper(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Applique "attraper" à toutes les fonctions d'un objet contrôleur.
function attraperTout(controleur) {
  const protege = {};
  for (const [nom, fn] of Object.entries(controleur)) {
    protege[nom] = typeof fn === "function" ? attraper(fn) : fn;
  }
  return protege;
}

module.exports = { attraper, attraperTout };
