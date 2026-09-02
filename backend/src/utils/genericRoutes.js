const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");

// Construit un routeur CRUD standard: liste/lecture ouvertes à tout utilisateur
// connecté, écriture ouverte à tous les rôles connectés, suppression réservée à l'admin.
function genericRoutes(controller, { deleteRoles = ["admin"] } = {}) {
  const router = express.Router();
  router.use(requireAuth);
  router.get("/", controller.list);
  router.get("/:id", controller.get);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", requireRole(...deleteRoles), controller.remove);
  return router;
}

module.exports = genericRoutes;
