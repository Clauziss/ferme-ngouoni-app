import React, { useEffect, useState } from "react";
import { api } from "../api/client";

const TYPES = ["Vaccination", "Aliment", "Réforme", "Paiement", "Autre"];

const formatFcfa = (n) => `${Math.round(n || 0).toLocaleString("fr-FR")} FCFA`;

export default function Rappels() {
  const [rappels, setRappels] = useState([]);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [valeurs, setValeurs] = useState({ type: "Vaccination" });
  const [lots, setLots] = useState([]);
  const [ventesNonSoldees, setVentesNonSoldees] = useState([]);
  const [erreur, setErreur] = useState("");

  function charger() {
    api.get("/rappels").then(setRappels).catch((e) => setErreur(e.message));
  }

  useEffect(() => {
    charger();
    api.get("/lots").then(setLots).catch(() => {});
    api.get("/ventes-non-soldees").then(setVentesNonSoldees).catch(() => {});
  }, []);

  const estPaiement = valeurs.type === "Paiement";

  async function soumettre(e) {
    e.preventDefault();
    try {
      // On n'envoie que le lien pertinent selon le type de rappel.
      const donnees = { ...valeurs };
      if (estPaiement) delete donnees.lotId;
      else delete donnees.venteId;

      await api.post("/rappels", donnees);
      setValeurs({ type: "Vaccination" });
      setFormulaireOuvert(false);
      charger();
      api.get("/ventes-non-soldees").then(setVentesNonSoldees).catch(() => {});
    } catch (e2) {
      setErreur(e2.message);
    }
  }

  async function marquerFait(id) {
    await api.patch(`/rappels/${id}/fait`);
    charger();
  }

  const aujourdHui = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="entete-page">
        <div>
          <h2 style={{ fontSize: "1.3rem" }}>Rappels</h2>
          <p style={{ color: "var(--texte-doux)", fontSize: "0.88rem", margin: "4px 0 0" }}>
            Vaccinations, réformes… et relances de paiement pour les ventes non soldées.
          </p>
        </div>
        <button className="bouton" onClick={() => setFormulaireOuvert((v) => !v)}>
          {formulaireOuvert ? "Fermer" : "+ Ajouter"}
        </button>
      </div>
      {erreur && <p className="erreur">{erreur}</p>}

      {formulaireOuvert && (
        <form className="panneau" onSubmit={soumettre}>
          <div className="formulaire">
            <label>
              Titre
              <input required value={valeurs.titre || ""} onChange={(e) => setValeurs((v) => ({ ...v, titre: e.target.value }))} />
            </label>
            <label>
              Type
              <select value={valeurs.type} onChange={(e) => setValeurs((v) => ({ ...v, type: e.target.value }))}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            {estPaiement ? (
              <label>
                Vente à relancer
                <select
                  required
                  value={valeurs.venteId || ""}
                  onChange={(e) => setValeurs((v) => ({ ...v, venteId: e.target.value }))}
                >
                  <option value="">—</option>
                  {ventesNonSoldees.map((v) => (
                    <option key={v.id} value={v.id}>{v.libelle}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                Volaille concernée (optionnel)
                <select value={valeurs.lotId || ""} onChange={(e) => setValeurs((v) => ({ ...v, lotId: e.target.value }))}>
                  <option value="">—</option>
                  {lots.map((l) => <option key={l.id} value={l.id}>{l.espece}</option>)}
                </select>
              </label>
            )}

            <label>
              Date prévue
              <input type="date" required value={valeurs.datePrevue || ""} onChange={(e) => setValeurs((v) => ({ ...v, datePrevue: e.target.value }))} />
            </label>
          </div>
          {estPaiement && ventesNonSoldees.length === 0 && (
            <p style={{ color: "var(--texte-doux)", fontSize: "0.85rem" }}>
              Aucune vente non soldée pour le moment.
            </p>
          )}
          <button type="submit" className="bouton">Enregistrer</button>
        </form>
      )}

      <div className="panneau">
        {rappels.length === 0 ? (
          <p style={{ color: "var(--texte-doux)" }}>Aucun rappel programmé.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Titre</th><th>Type</th><th>Concerne</th><th>Date prévue</th><th>Statut</th><th></th></tr>
            </thead>
            <tbody>
              {rappels.map((r) => {
                const enRetard = r.statut === "À faire" && r.datePrevue <= aujourdHui;
                return (
                  <tr key={r.id}>
                    <td>{r.titre}</td>
                    <td>{r.type}</td>
                    <td>
                      {r.Vente
                        ? `${r.Vente.client?.nom || "Occasionnel"} — reste ${formatFcfa(r.Vente.resteAPayerFcfa)}`
                        : r.Lot?.espece || "—"}
                    </td>
                    <td>{r.datePrevue}</td>
                    <td>
                      <span className={`puce ${r.statut === "Fait" ? "ok" : enRetard ? "alerte" : "neutre"}`}>
                        {r.statut === "Fait" ? "Fait" : enRetard ? "En attente / dû" : "À venir"}
                      </span>
                    </td>
                    <td>
                      {r.statut === "À faire" && (
                        <button className="bouton secondaire" style={{ padding: "4px 10px", fontSize: "0.78rem" }} onClick={() => marquerFait(r.id)}>
                          Marquer fait
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
