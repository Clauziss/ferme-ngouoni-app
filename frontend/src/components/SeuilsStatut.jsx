import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formaterDuree } from "../utils/inventaire";

// Réglage des âges auxquels une bande passe de « Poussin » à « Âge moyen »,
// puis à « Prêt à abattre », pour chaque type d'animal. Lecture pour tous,
// modification réservée aux administrateurs.
export default function SeuilsStatut({ onEnregistre }) {
  const { utilisateur } = useAuth();
  const estAdmin = utilisateur?.role === "admin";

  const [lignes, setLignes] = useState(null);
  const [saisie, setSaisie] = useState({}); // texte tapé, par espèce
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);

  function appliquer(donnees) {
    setLignes(donnees);
    setSaisie(
      Object.fromEntries(
        donnees.map((l) => [l.espece, { joursAgeMoyen: String(l.joursAgeMoyen), joursPretAbattre: String(l.joursPretAbattre) }])
      )
    );
  }

  useEffect(() => {
    api.get("/seuils-statut").then(appliquer).catch((e) => setErreur(e.message));
  }, []);

  const aChange = (l) =>
    saisie[l.espece].joursAgeMoyen !== String(l.joursAgeMoyen) ||
    saisie[l.espece].joursPretAbattre !== String(l.joursPretAbattre);
  const lignesModifiees = lignes ? lignes.filter(aChange) : [];

  function majChamp(espece, champ, valeur) {
    setSaisie((s) => ({ ...s, [espece]: { ...s[espece], [champ]: valeur } }));
    setMessage("");
    setErreur("");
  }

  function valeursParDefaut(l) {
    setSaisie((s) => ({
      ...s,
      [l.espece]: { joursAgeMoyen: String(l.defaut.joursAgeMoyen), joursPretAbattre: String(l.defaut.joursPretAbattre) },
    }));
    setMessage("");
  }

  async function enregistrer() {
    setErreur("");
    setMessage("");
    setEnvoi(true);
    try {
      // Seules les lignes modifiées sont envoyées : les autres gardent leurs
      // valeurs par défaut au lieu d'être figées en base.
      const donnees = await api.put("/seuils-statut", {
        seuils: lignesModifiees.map((l) => ({ espece: l.espece, ...saisie[l.espece] })),
      });
      appliquer(donnees);
      setMessage("Seuils enregistrés : les statuts du tableau sont à jour.");
      if (onEnregistre) onEnregistre();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoi(false);
    }
  }

  const duree = (texte) => {
    const n = parseInt(texte, 10);
    return Number.isFinite(n) && n > 0 ? `≈ ${formaterDuree(n)}` : "";
  };

  return (
    <div className="panneau no-print">
      <div className="entete-seuils">
        <div>
          <h2>Statuts selon l'âge</h2>
          <p className="sous-titre-panneau" style={{ marginBottom: 0 }}>
            Le statut d'une bande se calcule tout seul : âge à l'arrivée + temps passé à la ferme.
            Poussin, puis Âge moyen, puis Prêt à abattre selon les seuils ci-dessous.
          </p>
        </div>
        <button className="bouton secondaire" onClick={() => setOuvert((v) => !v)} aria-expanded={ouvert}>
          {ouvert ? "Masquer les seuils" : estAdmin ? "Voir / régler les seuils" : "Voir les seuils"}
        </button>
      </div>

      {ouvert && lignes && (
        <>
          <p className="sous-titre-panneau" style={{ marginTop: 14 }}>
            Ces âges sont des repères courants, à ajuster selon vos races et votre marché.
            {!estAdmin && " Seuls les administrateurs peuvent les modifier."}
          </p>

          <div className="seuils-liste">
            {lignes.map((l) => (
              <div className="seuil-ligne" key={l.espece}>
                <div className="seuil-nom">
                  {l.espece}
                  {l.personnalise && <span className="puce neutre" style={{ marginLeft: 8 }}>personnalisé</span>}
                </div>
                <label>
                  « Âge moyen » dès (jours)
                  <input
                    type="number" min="1" step="1" inputMode="numeric"
                    disabled={!estAdmin}
                    value={saisie[l.espece].joursAgeMoyen}
                    onChange={(e) => majChamp(l.espece, "joursAgeMoyen", e.target.value)}
                  />
                  <small>{duree(saisie[l.espece].joursAgeMoyen)}</small>
                </label>
                <label>
                  « Prêt à abattre » dès (jours)
                  <input
                    type="number" min="1" step="1" inputMode="numeric"
                    disabled={!estAdmin}
                    value={saisie[l.espece].joursPretAbattre}
                    onChange={(e) => majChamp(l.espece, "joursPretAbattre", e.target.value)}
                  />
                  <small>{duree(saisie[l.espece].joursPretAbattre)}</small>
                </label>
                {estAdmin && (
                  <button
                    type="button" className="bouton secondaire"
                    onClick={() => valeursParDefaut(l)}
                    title="Remettre les valeurs proposées par défaut (à enregistrer ensuite)"
                  >
                    Par défaut
                  </button>
                )}
              </div>
            ))}
          </div>

          {erreur && <p className="erreur">{erreur}</p>}
          {message && <p className="succes">{message}</p>}

          {estAdmin && (
            <div className="actions-seuils">
              <button className="bouton" onClick={enregistrer} disabled={envoi || lignesModifiees.length === 0}>
                {envoi ? "…" : lignesModifiees.length > 0 ? `Enregistrer (${lignesModifiees.length} modifié${lignesModifiees.length > 1 ? "s" : ""})` : "Enregistrer"}
              </button>
            </div>
          )}
        </>
      )}
      {!ouvert && erreur && <p className="erreur" style={{ marginTop: 10 }}>{erreur}</p>}
    </div>
  );
}
