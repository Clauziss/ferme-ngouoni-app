// Fabrique de contrôleurs CRUD génériques pour éviter de répéter le même code
// pour chaque entité (Lots, Depenses, Ventes, etc.)

function crudFactory(Model, options = {}) {
  const { include = [] } = options;

  return {
    async list(req, res) {
      const items = await Model.findAll({ include, order: [["id", "DESC"]] });
      res.json(items);
    },

    async get(req, res) {
      const item = await Model.findByPk(req.params.id, { include });
      if (!item) return res.status(404).json({ erreur: "Introuvable." });
      res.json(item);
    },

    async create(req, res) {
      try {
        const item = await Model.create(req.body);
        res.status(201).json(item);
      } catch (err) {
        res.status(400).json({ erreur: err.message });
      }
    },

    async update(req, res) {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ erreur: "Introuvable." });
      try {
        await item.update(req.body);
        res.json(item);
      } catch (err) {
        res.status(400).json({ erreur: err.message });
      }
    },

    async remove(req, res) {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ erreur: "Introuvable." });
      await item.destroy();
      res.status(204).send();
    },
  };
}

module.exports = crudFactory;
