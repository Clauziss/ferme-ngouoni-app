import React, { useEffect, useState } from "react";
import { api } from "../api/client";

const formatFcfa = (n) => `${Math.round(n || 0).toLocaleString("fr-FR")} FCFA`;

function libelleProduit(v) {
  return v.typeProduit === "Oeufs" ? `Œufs (${v.sousTypeOeufs || "—"})` : v.typeProduit;
}

// Fenêtre d'ajout d'un versement sur une vente partiellement payée.
// Affiche l'historique complet des versements déjà enregistrés.
export default function DialoguePaiement({ venteId, onFermer, onEnregistre }) {
  const [donnees, setDonnees] = useState(null);
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [observations, setObservations] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  function charger() {
    api
      .get(`/ventes/${venteId}/paiements`)
      .then(setDonnees)
      .catch((e) => setErreur(e.message));
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line
  }, [venteId]);

  async function soumettre(e) {
    e.preventDefault();
    setErreur("");
    setEnvoiEnCours(true);
    try {
      await api.post(`/ventes/${venteId}/paiements`, {
        date,
        montantFcfa: montant,
        observations,
      });
      setMontant("");
      setObservations("");
      charger();
      if (onEnregistre) onEnregistre();
    } catch (e2) {
      setErreur(e2.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  const v = donnees?.vente;
  const solde = v ? v.resteAPayerFcfa : 0;

  return (
    <div className="overlay-modale" onClick={onFermer}>
      <div className="modale" onClick={(e) => e.stopPropagation()}>
        <h3>Versements sur la vente</h3>
        {v && (
          <p className="sous-titre-modale">
            {v.date} — {v.client} — {v.sujet} — {libelleProduit(v)}
          </p>
        )}

        {erreur && <p className="erreur">{erreur}</p>}

        {!donnees ? (
          <p>Chargement…</p>
        ) : (
          <>
            <div className="grille-stats" style={{ marginBottom: 18 }}>
              <div className="carte-oeuf">
                <div className="label">Total de la vente</div>
                <div className="valeur" style={{ fontSize: "1.25rem" }}>
                  {formatFcfa(v.montantTotalFcfa)}
                </div>
              </div>
              <div className="carte-oeuf">
                <div className="label">Déjà encaissé</div>
                <div className="valeur" style={{ fontSize: "1.25rem" }}>
                  {formatFcfa(v.montantEncaisseFcfa)}
                </div>
              </div>
              <div className="carte-oeuf">
                <div className="label">Reste à payer</div>
                <div className={`valeur ${solde > 0 ? "negatif" : ""}`} style={{ fontSize: "1.25rem" }}>
                  {formatFcfa(solde)}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: "0.92rem", marginBottom: 8 }}>Historique des versements</h4>
            {donnees.paiements.length === 0 ? (
              <p style={{ color: "var(--texte-doux)", fontSize: "0.85rem" }}>
                Aucun versement enregistré pour l'instant.
              </p>
            ) : (
              <table>
                <thead>
                  <tr><th>Date</th><th>Montant</th><th>Observation</th></tr>
                </thead>
                <tbody>
                  {donnees.paiements.map((p) => (
                    <tr key={p.id}>
                      <td>{p.date}</td>
                      <td>{formatFcfa(p.montantFcfa)}</td>
                      <td>{p.observations || "—"}</td>
                    </tr>
                  ))}
                  <tr className="ligne-total">
                    <td>Total encaissé</td>
                    <td>{formatFcfa(v.montantEncaisseFcfa)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}

            {solde > 0 ? (
              <form onSubmit={soumettre} style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: "0.92rem", marginBottom: 10 }}>Ajouter un versement</h4>
                <div className="formulaire">
                  <label>
                    Date du versement
                    <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
                  </label>
                  <label>
                    Montant versé (FCFA)
                    <input
                      type="number"
                      min="1"
                      max={solde}
                      step="any"
                      required
                      placeholder={`Maximum ${Math.round(solde)}`}
                      value={montant}
                      onChange={(e) => setMontant(e.target.value)}
                    />
                  </label>
                  <label>
                    Observation (facultatif)
                    <input
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="ex : versement en espèces"
                    />
                  </label>
                </div>
                <div className="modale-actions">
                  <button type="button" className="bouton secondaire" onClick={onFermer}>
                    Fermer
                  </button>
                  <button type="submit" className="bouton" disabled={envoiEnCours}>
                    {envoiEnCours ? "…" : "Enregistrer le versement"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="modale-actions">
                <span className="puce ok" style={{ marginRight: "auto" }}>Vente soldée</span>
                <button type="button" className="bouton" onClick={onFermer}>Fermer</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
