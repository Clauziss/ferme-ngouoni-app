// Calculs de stock — fonctions pures (aucun accès base de données), afin de
// pouvoir les tester isolément. Les accès base sont dans utils/stock.js.

const PALETTES_PAR_CARTON = 12;
const TYPES_VOLAILLE = ["Volaille vivante", "Volaille effilée"];

const nombre = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

const plat = (x) => (x && typeof x.toJSON === "function" ? x.toJSON() : x);

// Tout est converti en palettes (la plus petite unité) pour additionner et
// soustraire sans erreur d'arrondi, puis reconverti à l'affichage.
function enPalettes(cartons, palettes) {
  return nombre(cartons) * PALETTES_PAR_CARTON + nombre(palettes);
}

function formaterPalettes(totalPalettes) {
  const signe = totalPalettes < 0 ? "-" : "";
  const p = Math.abs(Math.round(totalPalettes));
  const c = Math.floor(p / PALETTES_PAR_CARTON);
  const r = p % PALETTES_PAR_CARTON;
  return `${signe}${c} carton${c > 1 ? "s" : ""}, ${r} palette${r > 1 ? "s" : ""}`;
}

// Stock d'œufs d'UNE espèce (Poule, Pintade, Canard) = production cumulée
// moins livraisons cumulées. `ignorerId` permet d'exclure une entrée, pour
// vérifier une modification ou une suppression.
function bilanOeufs(entrees, espece, { ignorerId } = {}) {
  let produit = 0;
  let livre = 0;
  let casses = 0;
  for (const brute of entrees) {
    const e = plat(brute);
    if (e.especeOeuf !== espece) continue;
    if (ignorerId != null && e.id === ignorerId) continue;
    produit += enPalettes(e.productionCartons, e.productionPalettes);
    livre += enPalettes(e.livreCartons, e.livrePalettes);
    casses += nombre(e.cassesNombre);
  }
  return { produit, livre, casses, stock: produit - livre };
}

// Nombre de sujets qu'une vente retire du cheptel : volaille vivante = la
// quantité ; volaille effilée = le nombre de sujets (la quantité est en kg) ;
// œufs = 0 (ils ne passent pas par le cheptel).
function sujetsVendus(vente) {
  const v = plat(vente);
  if (v.typeProduit === "Volaille vivante") return nombre(v.quantite);
  if (v.typeProduit === "Volaille effilée") return nombre(v.nombreSujets);
  return 0;
}

// Effectif disponible d'UN type d'animal. Les ventes ne sont pas rattachées
// à une bande précise mais au type : la déduction se fait donc par type.
//  - lotRemplace : simule la modification d'une bande
//  - lotIgnore   : simule la suppression d'une bande
//  - venteIgnoree: exclut une vente (pour vérifier sa modification)
function bilanCheptel(lots, ventes, espece, { lotRemplace, lotIgnore, venteIgnoree } = {}) {
  let liste = lots.map(plat).map((l) =>
    lotRemplace && l.id === lotRemplace.id ? { ...l, ...lotRemplace } : l
  );
  if (lotIgnore != null) liste = liste.filter((l) => l.id !== lotIgnore);
  liste = liste.filter((l) => l.espece === espece);

  const bandes = liste.length;
  const entres = liste.reduce((s, l) => s + nombre(l.effectifInitial), 0);
  const morts = liste.reduce((s, l) => s + nombre(l.mortaliteCumulee), 0);

  const vendus = ventes
    .map(plat)
    .filter((v) => v.sujet === espece && TYPES_VOLAILLE.includes(v.typeProduit))
    .filter((v) => venteIgnoree == null || v.id !== venteIgnoree)
    .reduce((s, v) => s + sujetsVendus(v), 0);

  return { bandes, entres, morts, vendus, disponible: entres - morts - vendus };
}

// Stock cumulé APRÈS chaque entrée, par espèce, dans l'ordre chronologique.
// Ajoute `stockApresPalettes` à chaque entrée sans changer l'ordre de la liste.
function ajouterStockCumule(entrees) {
  const copies = entrees.map((e) => ({ ...plat(e) }));
  const chrono = [...copies].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id
  );
  const cumul = {};
  for (const e of chrono) {
    const delta =
      enPalettes(e.productionCartons, e.productionPalettes) -
      enPalettes(e.livreCartons, e.livrePalettes);
    cumul[e.especeOeuf] = (cumul[e.especeOeuf] || 0) + delta;
    e.stockApresPalettes = cumul[e.especeOeuf];
  }
  return copies;
}

// Durée passée à la ferme, en jours entiers.
function joursALaFerme(dateEntree, maintenant = new Date()) {
  const debut = new Date(dateEntree);
  if (Number.isNaN(debut.getTime())) return null;
  return Math.max(0, Math.floor((maintenant - debut) / (1000 * 60 * 60 * 24)));
}

module.exports = {
  PALETTES_PAR_CARTON,
  TYPES_VOLAILLE,
  nombre,
  enPalettes,
  formaterPalettes,
  bilanOeufs,
  sujetsVendus,
  bilanCheptel,
  ajouterStockCumule,
  joursALaFerme,
};
