const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const genericRoutes = require("../utils/genericRoutes");
const crudFactory = require("../utils/crudFactory");
const {
  Lot, ProductionOeuf, ProductionChair, Reproduction, Depense, Vente, Abonne,
} = require("../models");

const authController = require("../controllers/authController");
const dashboardController = require("../controllers/dashboardController");
const rappelController = require("../controllers/rappelController");
const rapportController = require("../controllers/rapportController");
const { semerSiVide } = require("../utils/semer");

const router = express.Router();

// --- Auth ---
router.post("/auth/connexion", authController.connexion);
router.post("/auth/inscrire", requireAuth, requireRole("admin"), authController.inscrire);

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
router.get("/utilisateurs", requireAuth, requireRole("admin"), authController.listerUtilisateurs);
router.delete("/utilisateurs/:id", requireAuth, requireRole("admin"), authController.supprimerUtilisateur);

// --- CRUD génériques par entité ---
router.use("/lots", genericRoutes(crudFactory(Lot)));
router.use("/production-oeufs", genericRoutes(crudFactory(ProductionOeuf)));
router.use("/production-chair", genericRoutes(crudFactory(ProductionChair)));
router.use("/reproduction", genericRoutes(crudFactory(Reproduction)));
router.use("/depenses", genericRoutes(crudFactory(Depense)));
router.use("/ventes", genericRoutes(crudFactory(Vente, { include: [{ model: Abonne, as: "client" }] })));
router.use("/abonnes", genericRoutes(crudFactory(Abonne)));

// --- Tableau de bord ---
router.get("/dashboard/rentabilite", requireAuth, dashboardController.rentabiliteParLot);
router.get("/dashboard/alerte-reforme", requireAuth, dashboardController.alerteReforme);
router.get("/dashboard/tendance", requireAuth, dashboardController.tendance30Jours);
router.get("/dashboard/analyse", requireAuth, dashboardController.analyse);

// --- Rapports imprimables ---
router.get("/rapports/clients", requireAuth, rapportController.rapportClients);
router.get("/ventes-non-soldees", requireAuth, rapportController.ventesNonSoldees);

// --- Rappels / notifications ---
router.get("/rappels", requireAuth, rappelController.list);
router.get("/rappels/dus", requireAuth, rappelController.dus);
router.post("/rappels", requireAuth, rappelController.create);
router.patch("/rappels/:id/fait", requireAuth, rappelController.marquerFait);
router.delete("/rappels/:id", requireAuth, requireRole("admin"), rappelController.remove);

module.exports = router;
