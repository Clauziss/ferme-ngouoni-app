const bcrypt = require("bcryptjs");
const { Utilisateur, Lot, ProductionOeuf, ProductionChair, Depense, Vente, Abonne } = require("../models");

// Insère les données de test UNIQUEMENT si la base est vide (aucun
// utilisateur). Ne supprime jamais rien — sûr à appeler plusieurs fois.
async function semerSiVide() {
  const nbUtilisateurs = await Utilisateur.count();
  if (nbUtilisateurs > 0) {
    return { dejaFait: true };
  }

  const motDePasseHash = await bcrypt.hash("admin1234", 10);
  await Utilisateur.create({ nom: "Admin Ferme", email: "admin@ferme.local", motDePasseHash, role: "admin" });

  await Lot.bulkCreate([
    { espece: "Pondeuses réforme", dateEntree: "2026-01-15", effectifInitial: 50, mortaliteCumulee: 2, statut: "Prêt à abattre" },
    { espece: "Poulets de chair", dateEntree: "2026-06-01", effectifInitial: 200, mortaliteCumulee: 5, statut: "Âge moyen" },
    { espece: "Canards", dateEntree: "2026-05-10", effectifInitial: 80, mortaliteCumulee: 3, statut: "Prêt à abattre" },
    { espece: "Pintades", dateEntree: "2026-04-20", effectifInitial: 60, mortaliteCumulee: 1, statut: "Poussin" },
    { espece: "Coquelets", dateEntree: "2026-07-01", effectifInitial: 100, mortaliteCumulee: 2, statut: "Poussin" },
  ]);

  await ProductionOeuf.create({
    date: "2026-08-13",
    especeOeuf: "Poule",
    productionCartons: 3, productionPalettes: 5,
    cassesNombre: 6,
    livreCartons: 2, livrePalettes: 0,
    stockCartons: 1, stockPalettes: 3,
  });

  await ProductionChair.create({
    date: "2026-08-13", sujet: "Poulets de chair",
    poidsMinimalKg: 1.1, poidsMaximalKg: 1.8, poidsMoyenKg: 1.45, nbSujetsPeses: 20,
  });

  await Depense.create({
    date: "2026-08-11", poulailler: "Poulets de chair", categorie: "Aliment de croissance",
    description: "Sac de provende croissance 50kg x4", montantFcfa: 95000,
  });

  const client = await Abonne.create({
    nom: "Restaurant Le Baobab",
    ville: "Libreville",
    contacts: "+241 XX XX XX XX",
  });

  // Vente à un abonné, payée intégralement
  await Vente.create({
    date: "2026-08-13", sujet: "Pondeuses réforme", typeProduit: "Oeufs", sousTypeOeufs: "En détail",
    quantite: 15, prixUnitaireFcfa: 4500, montantEncaisseFcfa: 67500,
    observations: "Livraison hebdomadaire habituelle", clientId: client.id,
  });

  // Vente occasionnelle (sans client), partiellement payée
  await Vente.create({
    date: "2026-08-12", sujet: "Poulets de chair", typeProduit: "Volaille vivante",
    quantite: 10, prixUnitaireFcfa: 6000, montantEncaisseFcfa: 40000,
    observations: "Client de passage, solde promis en fin de semaine",
  });

  return { dejaFait: false };
}

module.exports = { semerSiVide };
