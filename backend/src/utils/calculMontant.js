// Le total d'une vente est toujours quantite * prixUnitaire — l'unité de la
// quantité (sujets, kg, cartons, palettes) dépend du type de produit mais ne
// change pas le calcul.
function montantVente(vente) {
  return (vente.quantite || 0) * (vente.prixUnitaireFcfa || 0);
}

// Ce qu'il reste à encaisser sur cette vente.
function resteAPayer(vente) {
  return montantVente(vente) - (vente.montantEncaisseFcfa || 0);
}

module.exports = { montantVente, resteAPayer };
