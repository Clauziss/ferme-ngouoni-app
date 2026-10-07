// Fabrique de contrôleurs CRUD génériques pour éviter de répéter le même code
// pour chaque entité (Lots, Depenses, Ventes, etc.)
//
// Options :
//  - include            : relations à joindre
//  - valider(donnees, existant)  : appelée avant création/modification ; lève
//                         une erreur pour refuser (réponse 400 avec le message)
//  - validerSuppression(item)    : appelée avant suppression ; refuse (409)
//  - enrichir(items)    : transforme la liste avant de la renvoyer
//                         (ex : ajouter un champ calculé)

function crudFactory(Model, options = {}) {
  const { include = [], valider, validerSuppression, enrichir } = options;

  return {
    async list(req, res) {
      const items = await Model.findAll({ include, order: [["id", "DESC"]] });
      res.json(enrichir ? await enrichir(items) : items);
    },

    async get(req, res) {
      const item = await Model.findByPk(req.params.id, { include });
      if (!item) return res.status(404).json({ erreur: "Introuvable." });
      res.json(item);
    },

    async create(req, res) {
      try {
        if (valider) await valider(req.body, null);
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
        if (valider) await valider(req.body, item);
        await item.update(req.body);
        res.json(item);
      } catch (err) {
        res.status(400).json({ erreur: err.message });
      }
    },

    async remove(req, res) {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ erreur: "Introuvable." });
      if (validerSuppression) {
        try {
          await validerSuppression(item);
        } catch (err) {
          return res.status(409).json({ erreur: err.message });
        }
      }
      await item.destroy();
      res.status(204).send();
    },
  };
}

module.exports = crudFactory;
