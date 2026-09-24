require("dotenv").config();
const sequelize = require("./config/database");
require("./models");
const { semerSiVide } = require("./utils/semer");

async function seed() {
  await sequelize.sync();
  const resultat = await semerSiVide();
  if (resultat.dejaFait) {
    console.log("Des utilisateurs existent déjà — rien n'a été ajouté.");
  } else {
    console.log("Données de test insérées.");
    console.log("Connexion : admin@ferme.local / admin1234");
  }
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
