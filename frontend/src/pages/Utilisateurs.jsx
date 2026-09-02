import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Utilisateurs() {
  const { utilisateur } = useAuth();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [valeurs, setValeurs] = useState({ role: "employe" });
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  function charger() {
    setChargement(true);
    api.get("/utilisateurs").then(setUtilisateurs).catch((e) => setErreur(e.message)).finally(() => setChargement(false));
  }

  useEffect(() => { charger(); }, []);

  async function soumettre(e) {
    e.preventDefault();
    setErreur("");
    try {
      await api.post("/auth/inscrire", valeurs);
      setValeurs({ role: "employe" });
      setFormulaireOuvert(false);
      charger();
    } catch (e2) {
      setErreur(e2.message);
    }
  }

  async function supprimer(id) {
    if (!window.confirm("Supprimer ce compte ?")) return;
    try {
      await api.del(`/utilisateurs/${id}`);
      charger();
    } catch (e) {
      setErreur(e.message);
    }
  }

  return (
    <div>
      <div className="entete-page">
        <div>
          <h2 style={{ fontSize: "1.3rem" }}>Comptes utilisateurs</h2>
          <p style={{ color: "var(--texte-doux)", fontSize: "0.88rem", margin: "4px 0 0" }}>
            Crée un compte pour chaque personne qui doit utiliser l'appli.
          </p>
        </div>
        <button className="bouton" onClick={() => setFormulaireOuvert((v) => !v)}>
          {formulaireOuvert ? "Fermer" : "+ Créer un compte"}
        </button>
      </div>

      {erreur && <p className="erreur">{erreur}</p>}

      {formulaireOuvert && (
        <form className="panneau" onSubmit={soumettre}>
          <div className="formulaire">
            <label>
              Nom complet
              <input required value={valeurs.nom || ""} onChange={(e) => setValeurs((v) => ({ ...v, nom: e.target.value }))} />
            </label>
            <label>
              Email (sert à se connecter)
              <input type="email" required value={valeurs.email || ""} onChange={(e) => setValeurs((v) => ({ ...v, email: e.target.value }))} />
            </label>
            <label>
              Mot de passe
              <input type="password" required minLength={6} value={valeurs.motDePasse || ""} onChange={(e) => setValeurs((v) => ({ ...v, motDePasse: e.target.value }))} />
            </label>
            <label>
              Rôle
              <select value={valeurs.role} onChange={(e) => setValeurs((v) => ({ ...v, role: e.target.value }))}>
                <option value="employe">Employé (saisie uniquement)</option>
                <option value="admin">Administrateur (accès complet)</option>
              </select>
            </label>
          </div>
          <button type="submit" className="bouton">Créer le compte</button>
        </form>
      )}

      <div className="panneau">
        {chargement ? (
          <p>Chargement…</p>
        ) : (
          <table>
            <thead>
              <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Créé le</th><th></th></tr>
            </thead>
            <tbody>
              {utilisateurs.map((u) => (
                <tr key={u.id}>
                  <td>{u.nom}</td>
                  <td>{u.email}</td>
                  <td><span className={`puce ${u.role === "admin" ? "ok" : "neutre"}`}>{u.role}</span></td>
                  <td>{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td>
                    {u.id !== utilisateur?.id && (
                      <button className="bouton danger" style={{ padding: "4px 10px", fontSize: "0.78rem" }} onClick={() => supprimer(u.id)}>
                        Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
