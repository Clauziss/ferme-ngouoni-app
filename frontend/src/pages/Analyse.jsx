import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import EnteteImpression from "../components/EnteteImpression";

const TYPES = ["Poulets de chair", "Canards", "Pintades", "Pondeuses réforme", "Coquelets"];

const formatFcfa = (n) => (n == null ? "—" : `${Math.round(n).toLocaleString("fr-FR")} FCFA`);
const formatPct = (n) => (n == null ? "—" : `${(n * 100).toFixed(1)} %`);

export default function Analyse() {
  const [type, setType] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  async function lancerAnalyse() {
    setChargement(true);
    setErreur("");
    const params = new URLSearchParams();
    if (type) params.set("espece", type);
    if (dateDebut) params.set("dateDebut", dateDebut);
    if (dateFin) params.set("dateFin", dateFin);
    try {
      const data = await api.get(`/dashboard/analyse?${params.toString()}`);
      setDonnees(data);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { lancerAnalyse(); /* eslint-disable-next-line */ }, []);

  const sousTitreFiltre = [
    type || "Tous types",
    dateDebut ? `depuis ${dateDebut}` : null,
    dateFin ? `jusqu'au ${dateFin}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div>
      <EnteteImpression titre="Analyse" sousTitre={sousTitreFiltre} />
      <div className="entete-page">
        <div>
          <h2 style={{ fontSize: "1.3rem" }}>Analyse</h2>
          <p style={{ color: "var(--texte-doux)", fontSize: "0.88rem", margin: "4px 0 0" }}>
            Filtre par type et période pour observer ce qui t'intéresse.
          </p>
        </div>
        <button className="bouton secondaire no-print" onClick={() => window.print()}>🖨️ Imprimer</button>
      </div>

      <div className="filtres no-print">
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Tous</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          Depuis le
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
        </label>
        <label>
          Jusqu'au
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
        </label>
        <button className="bouton" onClick={lancerAnalyse} disabled={chargement}>
          {chargement ? "…" : "Appliquer"}
        </button>
      </div>

      {erreur && <p className="erreur">{erreur}</p>}

      {donnees && (
        <>
          <div className="grille-stats">
            <div className="carte-oeuf">
              <div className="label">🧺 Ventes</div>
              <div className="valeur">{formatFcfa(donnees.ventes.totalFcfa)}</div>
            </div>
            <div className="carte-oeuf">
              <div className="label">💰 Dépenses</div>
              <div className="valeur">{formatFcfa(donnees.depenses.totalFcfa)}</div>
            </div>
            <div className="carte-oeuf">
              <div className="label">📈 Marge</div>
              <div className={`valeur ${donnees.margeFcfa < 0 ? "negatif" : ""}`}>{formatFcfa(donnees.margeFcfa)}</div>
            </div>
            <div className="carte-oeuf">
              <div className="label">🥚 Œufs produits (cartons) / cassés</div>
              <div className="valeur" style={{ fontSize: "1.3rem" }}>
                {donnees.production.oeufs.totalProductionCartons.toFixed(1)} / {donnees.production.oeufs.totalCassesNombre}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--texte-doux)" }}>
                Taux de casse : {formatPct(donnees.production.oeufs.tauxCasse)}
              </div>
            </div>
          </div>

          <div className="panneau">
            <h2>Cheptel concerné ({donnees.lots.length})</h2>
            {donnees.lots.length === 0 ? (
              <p style={{ color: "var(--texte-doux)" }}>Aucune entrée ne correspond à ces filtres.</p>
            ) : (
              <table>
                <thead>
                  <tr><th>Type</th><th>Entrée</th><th>Statut</th><th>Effectif initial</th><th>Mortalité</th><th>Effectif actuel</th><th>Taux mortalité</th></tr>
                </thead>
                <tbody>
                  {donnees.lots.map((l, i) => (
                    <tr key={i}>
                      <td>{l.espece}</td>
                      <td>{l.dateEntree}</td>
                      <td><span className={`puce ${l.statut === "Prêt à abattre" ? "ok" : "neutre"}`}>{l.statut}</span></td>
                      <td>{l.effectifInitial}</td>
                      <td>{l.mortaliteCumulee}</td>
                      <td>{l.effectifActuel}</td>
                      <td className={l.tauxMortalite > 0.1 ? "erreur" : ""}>{formatPct(l.tauxMortalite)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="panneau">
            <h2>Ventes par type de produit</h2>
            {Object.keys(donnees.ventes.parType).length === 0 ? (
              <p style={{ color: "var(--texte-doux)" }}>Aucune vente sur cette période.</p>
            ) : (
              <table>
                <thead><tr><th>Type</th><th>Montant</th></tr></thead>
                <tbody>
                  {Object.entries(donnees.ventes.parType).map(([t, montant]) => (
                    <tr key={t}><td>{t}</td><td>{formatFcfa(montant)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="panneau">
            <h2>Dépenses par catégorie</h2>
            {Object.keys(donnees.depenses.parCategorie).length === 0 ? (
              <p style={{ color: "var(--texte-doux)" }}>Aucune dépense sur cette période.</p>
            ) : (
              <table>
                <thead><tr><th>Catégorie</th><th>Montant</th></tr></thead>
                <tbody>
                  {Object.entries(donnees.depenses.parCategorie).map(([cat, montant]) => (
                    <tr key={cat}><td>{cat}</td><td>{formatFcfa(montant)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {donnees.production.chair.nbPesees > 0 && (
            <div className="panneau">
              <h2>Suivi de masse</h2>
              <p>Poids moyen observé : <strong>{donnees.production.chair.poidsMoyenKg?.toFixed(2)} kg</strong> ({donnees.production.chair.nbPesees} pesées)</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
