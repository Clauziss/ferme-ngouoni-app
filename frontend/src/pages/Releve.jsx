import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import EnteteImpression from "../components/EnteteImpression";

const formatFcfa = (n) => `${Math.round(n || 0).toLocaleString("fr-FR")} FCFA`;

// Raccourcis de période courants, pour éviter de saisir les dates à la main.
function periodesRapides() {
  const aujourdHui = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);

  const debutMois = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), 1);
  const debutMoisPrecedent = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth() - 1, 1);
  const finMoisPrecedent = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), 0);
  const il7Jours = new Date(aujourdHui);
  il7Jours.setDate(il7Jours.getDate() - 6);
  const debutAnnee = new Date(aujourdHui.getFullYear(), 0, 1);

  return [
    { libelle: "Aujourd'hui", debut: iso(aujourdHui), fin: iso(aujourdHui), regroupement: "jour" },
    { libelle: "7 derniers jours", debut: iso(il7Jours), fin: iso(aujourdHui), regroupement: "jour" },
    { libelle: "Ce mois-ci", debut: iso(debutMois), fin: iso(aujourdHui), regroupement: "jour" },
    { libelle: "Mois dernier", debut: iso(debutMoisPrecedent), fin: iso(finMoisPrecedent), regroupement: "jour" },
    { libelle: "Cette année", debut: iso(debutAnnee), fin: iso(aujourdHui), regroupement: "mois" },
  ];
}

function formatPeriode(cle, regroupement) {
  if (regroupement === "mois") {
    const [annee, mois] = cle.split("-");
    const noms = ["janvier", "février", "mars", "avril", "mai", "juin",
      "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    return `${noms[parseInt(mois, 10) - 1]} ${annee}`;
  }
  return new Date(cle).toLocaleDateString("fr-FR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

export default function Releve() {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [type, setType] = useState("tout");
  const [clientId, setClientId] = useState("");
  const [regroupement, setRegroupement] = useState("jour");

  const [clients, setClients] = useState([]);
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  async function charger(params) {
    const p = params || { dateDebut, dateFin, type, clientId, regroupement };
    setChargement(true);
    setErreur("");
    const q = new URLSearchParams();
    if (p.dateDebut) q.set("dateDebut", p.dateDebut);
    if (p.dateFin) q.set("dateFin", p.dateFin);
    if (p.type) q.set("type", p.type);
    if (p.clientId) q.set("clientId", p.clientId);
    if (p.regroupement) q.set("regroupement", p.regroupement);
    try {
      setDonnees(await api.get(`/releve?${q.toString()}`));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
    api.get("/abonnes").then(setClients).catch(() => {});
    // eslint-disable-next-line
  }, []);

  function appliquerPeriode(p) {
    setDateDebut(p.debut);
    setDateFin(p.fin);
    setRegroupement(p.regroupement);
    charger({ dateDebut: p.debut, dateFin: p.fin, type, clientId, regroupement: p.regroupement });
  }

  const nomClient = clientId
    ? clientId === "occasionnel"
      ? "Clients occasionnels"
      : clients.find((c) => String(c.id) === String(clientId))?.nom
    : null;

  const sousTitre = [
    nomClient || "Tous les clients",
    type === "ventes" ? "ventes uniquement" : type === "depenses" ? "dépenses uniquement" : "ventes et dépenses",
    dateDebut ? `du ${dateDebut}` : null,
    dateFin ? `au ${dateFin}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div>
      <EnteteImpression titre="Relevé des mouvements" sousTitre={sousTitre} />

      <div className="entete-page">
        <div>
          <h2 style={{ fontSize: "1.3rem" }}>Relevés</h2>
          <p style={{ color: "var(--texte-doux)", fontSize: "0.88rem", margin: "4px 0 0" }}>
            Journalier, mensuel ou sur une période libre — ventes, dépenses, ou les deux.
          </p>
        </div>
        <button className="bouton secondaire no-print" onClick={() => window.print()}>🖨️ Imprimer</button>
      </div>

      <div className="no-print" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {periodesRapides().map((p) => (
          <button
            key={p.libelle}
            className="bouton secondaire"
            style={{ padding: "5px 12px", fontSize: "0.8rem" }}
            onClick={() => appliquerPeriode(p)}
          >
            {p.libelle}
          </button>
        ))}
      </div>

      <div className="filtres no-print">
        <label>
          Du
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
        </label>
        <label>
          Au
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
        </label>
        <label>
          Contenu
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="tout">Ventes et dépenses</option>
            <option value="ventes">Ventes uniquement</option>
            <option value="depenses">Dépenses uniquement</option>
          </select>
        </label>
        <label>
          Client
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Tous</option>
            <option value="occasionnel">Occasionnels</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </label>
        <label>
          Regrouper par
          <select value={regroupement} onChange={(e) => setRegroupement(e.target.value)}>
            <option value="jour">Jour</option>
            <option value="mois">Mois</option>
          </select>
        </label>
        <button className="bouton" onClick={() => charger()} disabled={chargement}>
          {chargement ? "…" : "Appliquer"}
        </button>
      </div>

      {erreur && <p className="erreur">{erreur}</p>}

      {donnees && (
        <>
          <div className="grille-stats">
            <div className="carte-oeuf">
              <div className="label">🧺 Entrées (ventes)</div>
              <div className="valeur">{formatFcfa(donnees.totaux.entrees)}</div>
            </div>
            <div className="carte-oeuf">
              <div className="label">💰 Sorties (dépenses)</div>
              <div className="valeur">{formatFcfa(donnees.totaux.sorties)}</div>
            </div>
            <div className="carte-oeuf">
              <div className="label">📈 Solde</div>
              <div className={`valeur ${donnees.totaux.solde < 0 ? "negatif" : ""}`}>
                {formatFcfa(donnees.totaux.solde)}
              </div>
            </div>
            <div className="carte-oeuf">
              <div className="label">⏳ Reste à encaisser</div>
              <div className={`valeur ${donnees.totaux.resteAPayer > 0 ? "negatif" : ""}`}>
                {formatFcfa(donnees.totaux.resteAPayer)}
              </div>
            </div>
          </div>

          {donnees.groupes.length === 0 ? (
            <div className="panneau">
              <p style={{ color: "var(--texte-doux)" }}>Aucun mouvement sur cette période.</p>
            </div>
          ) : (
            donnees.groupes.map((g) => (
              <div className="panneau" key={g.periode}>
                <h2 style={{ textTransform: "capitalize" }}>{formatPeriode(g.periode, regroupement)}</h2>
                <p className="sous-titre-panneau">
                  Entrées {formatFcfa(g.entrees)} · Sorties {formatFcfa(g.sorties)} ·
                  {" "}Solde <strong>{formatFcfa(g.solde)}</strong>
                </p>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th><th>Sens</th><th>Libellé</th><th>Client</th>
                      <th>Détail</th><th>Montant</th><th>Encaissé</th><th>Reste</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.mouvements.map((m, i) => (
                      <tr key={i}>
                        <td>{m.date}</td>
                        <td>
                          <span className={`puce ${m.sens === "Entrée" ? "ok" : "alerte"}`}>{m.sens}</span>
                        </td>
                        <td>{m.libelle}</td>
                        <td>{m.client || "—"}</td>
                        <td style={{ fontSize: "0.82rem" }}>{m.detail || "—"}</td>
                        <td>{formatFcfa(m.montantFcfa)}</td>
                        <td>{m.encaisseFcfa == null ? "—" : formatFcfa(m.encaisseFcfa)}</td>
                        <td className={m.resteFcfa > 0 ? "erreur" : ""}>
                          {m.resteFcfa == null ? "—" : formatFcfa(m.resteFcfa)}
                        </td>
                      </tr>
                    ))}
                    <tr className="ligne-total">
                      <td colSpan={5}>Solde de la période</td>
                      <td colSpan={3}>{formatFcfa(g.solde)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
