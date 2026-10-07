const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const genericRoutes = require("../utils/genericRoutes");
const { attraper } = require("../utils/attraper");
const crudFactory = require("../utils/crudFactory");
const {
  Lot, ProductionOeuf, ProductionChair, Reproduction, Depense, Vente, Abonne, Vaccination,
} = require("../models");

const authController = require("../controllers/authController");
const dashboardController = require("../controllers/dashboardController");
const rappelController = require("../controllers/rappelController");
const rapportController = require("../controllers/rapportController");
const paiementController = require("../controllers/paiementController");
const financeController = require("../controllers/financeController");
const releveController = require("../controllers/releveController");
const inventaireController = require("../controllers/inventaireController");
const seuilsController = require("../controllers/seuilsController");
const { enrichirLots } = require("../utils/seuils");
const { ajouterStockCumule } = require("../utils/bilans");
const {
  validerEntreeOeufs, validerSuppressionOeufs, validerVenteCheptel, validerBande, validerSuppressionBande,
} = require("../utils/stock");
const { semerSiVide } = require("../utils/semer");

const router = express.Router();

// --- Auth ---
router.post("/auth/connexion", attraper(authController.connexion));
router.post("/auth/inscrire", requireAuth, requireRole("admin"), attraper(authController.inscrire));

// --- Initialisation (une seule fois) : crée le compte admin et les données
// d'exemple si la base est vide. Protégé par un mot de passe secret défini
// dans la variable d'environnement SETUP_SECRET.
router.get("/setup", async (req, res) => {
  if (!process.env.SETUP_SECRET || req.query.secret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ erreur: "Accès refusé." });
  }
  try {
    const resultat = await semerSiVide();
    res.json(
      resultat.dejaFait
        ? { message: "Des comptes existent déjà, rien n'a été modifié." }
        : { message: "Compte admin et données de test créés. Connexion : admin@ferme.local / admin1234" }
    );
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// --- Gestion des comptes (admin uniquement) ---
router.get("/utilisateurs", requireAuth, requireRole("admin"), attraper(authController.listerUtilisateurs));
router.delete("/utilisateurs/:id", requireAuth, requireRole("admin"), attraper(authController.supprimerUtilisateur));

// --- CRUD génériques par entité ---
// Cheptel : une bande ne peut pas être modifiée/supprimée si cela rendrait
// l'effectif négatif par rapport aux ventes déjà enregistrées.
router.use("/lots", genericRoutes(crudFactory(Lot, {
  valider: validerBande,
  validerSuppression: validerSuppressionBande,
  enrichir: enrichirLots, // ajoute l'âge et le statut calculés
})));

// Seuils de statut par espèce : lecture pour tous, modification pour l'admin.
router.get("/seuils-statut", requireAuth, attraper(seuilsController.lister));
router.put("/seuils-statut", requireAuth, requireRole("admin"), attraper(seuilsController.enregistrer));
// Production d'œufs : une livraison ne peut pas dépasser le stock disponible,
// et chaque ligne renvoie le stock cumulé obtenu après elle.
router.use("/production-oeufs", genericRoutes(crudFactory(ProductionOeuf, {
  valider: validerEntreeOeufs,
  validerSuppression: validerSuppressionOeufs,
  enrichir: ajouterStockCumule,
})));
router.use("/production-chair", genericRoutes(crudFactory(ProductionChair)));
router.use("/vaccinations", genericRoutes(crudFactory(Vaccination, { include: [Lot] })));
router.use("/reproduction", genericRoutes(crudFactory(Reproduction)));
router.use("/depenses", genericRoutes(crudFactory(Depense)));
// --- Paiements : historique et versements complémentaires ---
router.get("/ventes/:id/paiements", requireAuth, attraper(paiementController.listerPourVente));
router.post("/ventes/:id/paiements", requireAuth, attraper(paiementController.ajouter));
// Ventes : une vente de volaille ne peut pas dépasser l'effectif du cheptel.
router.use("/ventes", genericRoutes(crudFactory(Vente, {
  include: [{ model: Abonne, as: "client" }],
  valider: validerVenteCheptel,
})));

// Inventaire : photo du cheptel et du stock d'œufs.
router.get("/inventaire", requireAuth, attraper(inventaireController.inventaire));
router.use("/abonnes", genericRoutes(crudFactory(Abonne)));

// --- Tableau de bord ---
router.get("/dashboard/rentabilite", requireAuth, attraper(dashboardController.rentabiliteParLot));
router.get("/dashboard/alerte-reforme", requireAuth, attraper(dashboardController.alerteReforme));
router.get("/dashboard/tendance", requireAuth, attraper(dashboardController.tendance30Jours));
router.get("/dashboard/analyse", requireAuth, attraper(dashboardController.analyse));

// --- Rapports imprimables ---
router.get("/rapports/clients", requireAuth, attraper(rapportController.rapportClients));
router.get("/ventes-non-soldees", requireAuth, attraper(rapportController.ventesNonSoldees));


// --- Relevés ---
router.get("/releve", requireAuth, attraper(releveController.releve));

// --- Gestion financière ---
router.get("/finance/tresorerie", requireAuth, attraper(financeController.tresorerie));
router.get("/finance/cout-revient", requireAuth, attraper(financeController.coutRevient));
router.get("/finance/compte-resultat", requireAuth, attraper(financeController.compteResultat));
router.get("/finance/seuil-rentabilite", requireAuth, attraper(financeController.seuilRentabilite));

// --- Rappels / notifications ---
router.get("/rappels", requireAuth, attraper(rappelController.list));
router.get("/rappels/dus", requireAuth, attraper(rappelController.dus));
router.post("/rappels", requireAuth, attraper(rappelController.create));
router.patch("/rappels/:id/fait", requireAuth, attraper(rappelController.marquerFait));
router.delete("/rappels/:id", requireAuth, requireRole("admin"), attraper(rappelController.remove));

module.exports = router;
