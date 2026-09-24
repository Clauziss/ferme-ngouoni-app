import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import EnteteImpression from "../components/EnteteImpression";

const formatFcfa = (n) => `${Math.round(n || 0).toLocaleString("fr-FR")} FCFA`;

function uniteQuantite(a) {
  if (a.typeProduit === "Volaille vivante") return "sujet(s)";
  if (a.typeProduit === "Volaille effilée") return "kg";
  if (a.sousTypeOeufs === "En gros") return "carton(s)";
  if (a.sousTypeOeufs === "En détail") return "palette(s)";
  return "";
}

function libelleProduit(a) {
  return a.typeProduit === "Oeufs" ? `Œufs (${a.sousTypeOeufs || "—"})` : a.typeProduit;
}

export default function RapportClients() {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [clientChoisi, setClientChoisi] = useState(""); // "" = tous
  const [clients, setClients] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [detailOuvert, setDetailOuvert] = useState({});

  async function charger() {
    setChargement(true);
    setErreur("");
    const params = new URLSearchParams();
    if (dateDebut) params.set("dateDebut", dateDebut);
    if (dateFin) params.set("dateFin", dateFin);
    try {
      const data = await api.get(`/rapports/clients?${params.toString()}`);
      setClients(data);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (clientChoisi) setDetailOuvert((d) => ({ ...d, [clientChoisi]: true }));
  }, [clientChoisi]);

  // Sélectionne le client, déplie son détail, puis lance l'impression une fois
  // que l'écran s'est mis à jour — le rapport imprimé ne contient que lui.
  function imprimerUnClient(id) {
    setClientChoisi(String(id));
    setDetailOuvert((d) => ({ ...d, [id]: true }));
    setTimeout(() => window.print(), 250);
  }

  const clientsAffiches = clientChoisi
    ? clients.filter((c) => String(c.id) === String(clientChoisi))
    : clients;

  const totalGeneral = clientsAffiches.reduce((s, c) => s + c.montantTotal, 0);
  const totalEncaisse = clientsAffiches.reduce((s, c) => s + c.montantEncaisse, 0);
  const totalReste = clientsAffiches.reduce((s, c) => s + c.resteAPayer, 0);

  const nomClientChoisi = clientChoisi
    ? clients.find((c) => String(c.id) === String(clientChoisi))?.nom
    : null;

  const sousTitre = [
    nomClientChoisi || "Tous les clients",
    dateDebut ? `depuis ${dateDebut}` : null,
    dateFin ? `jusqu'au ${dateFin}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div>
      <EnteteImpression titre="Rapport clients" sousTitre={sousTitre} />
      <div className="entete-page">
        <div>
          <h2 style={{ fontSize: "1.3rem" }}>Rapport clients</h2>
          <p style={{ color: "var(--texte-doux)", fontSize: "0.88rem", margin: "4px 0 0" }}>
            Les ventes sans abonné rattaché sont regroupées sous « Occasionnel ». La fréquence est déduite des dates d'achat réelles.
          </p>
        </div>
        <button className="bouton secondaire no-print" onClick={() => window.print()}>🖨️ Imprimer</button>
      </div>

      <div className="filtres no-print">
        <label>
          Client
          <select value={clientChoisi} onChange={(e) => setClientChoisi(e.target.value)}>
            <option value="">Tous les clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
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
        <button className="bouton" onClick={charger} disabled={chargement}>
          {chargement ? "…" : "Appliquer"}
        </button>
      </div>

      {erreur && <p className="erreur">{erreur}</p>}

      <div className="grille-stats">
        <div className="carte-oeuf">
          <div className="label">🧾 Total vendu</div>
          <div className="valeur">{formatFcfa(totalGeneral)}</div>
        </div>
        <div className="carte-oeuf">
          <div className="label">💵 Encaissé</div>
          <div className="valeur">{formatFcfa(totalEncaisse)}</div>
        </div>
        <div className="carte-oeuf">
          <div className="label">⏳ Reste à payer</div>
          <div className={`valeur ${totalReste > 0 ? "negatif" : ""}`}>{formatFcfa(totalReste)}</div>
        </div>
      </div>

      <div className="panneau">
        <h2>{nomClientChoisi ? `Rapport de ${nomClientChoisi}` : "Détail par client"}</h2>
        {clientsAffiches.length === 0 ? (
          <p style={{ color: "var(--texte-doux)" }}>Aucun client ou aucun achat sur cette période.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Client</th><th>Ville</th><th>Contact(s)</th><th>Fréquence</th>
                <th>Nb achats</th><th>Total</th><th>Encaissé</th><th>Reste</th>
                <th className="no-print"></th>
              </tr>
            </thead>
            <tbody>
              {clientsAffiches.map((c) => (
                <React.Fragment key={c.id}>
                  <tr>
                    <td>
                      {c.nom}
                      {c.estOccasionnel && (
                        <span className="puce neutre" style={{ marginLeft: 6 }}>sans compte</span>
                      )}
                    </td>
                    <td>{c.ville || "—"}</td>
                    <td>{c.contacts || "—"}</td>
                    <td>{c.frequence}</td>
                    <td>{c.nbCommandes}</td>
                    <td>{formatFcfa(c.montantTotal)}</td>
                    <td>{formatFcfa(c.montantEncaisse)}</td>
                    <td className={c.resteAPayer > 0 ? "erreur" : ""}>{formatFcfa(c.resteAPayer)}</td>
                    <td className="no-print">
                      {c.achats.length > 0 && (
                        <button
                          className="bouton secondaire"
                          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                          onClick={() => setDetailOuvert((d) => ({ ...d, [c.id]: !d[c.id] }))}
                        >
                          {detailOuvert[c.id] ? "Masquer" : "Détail"}
                        </button>
                      )}
                      <button
                        className="bouton secondaire"
                        style={{ padding: "4px 10px", fontSize: "0.78rem", marginLeft: 6 }}
                        onClick={() => imprimerUnClient(c.id)}
                        title={`Imprimer uniquement le rapport de ${c.nom}`}
                      >
                        🖨️
                      </button>
                    </td>
                  </tr>
                  {(detailOuvert[c.id] || false) && c.achats.map((a, i) => (
                    <tr key={i} style={{ background: "#FAF6E8" }}>
                      <td colSpan={3} style={{ paddingLeft: 24, fontSize: "0.82rem" }}>
                        {a.date} — {a.sujet} — {libelleProduit(a)}
                        {a.observations ? ` — ${a.observations}` : ""}
                      </td>
                      <td colSpan={2} style={{ fontSize: "0.82rem" }}>
                        {a.quantite} {uniteQuantite(a)} × {formatFcfa(a.prixUnitaireFcfa)}
                      </td>
                      <td style={{ fontSize: "0.82rem" }}>{formatFcfa(a.montantFcfa)}</td>
                      <td style={{ fontSize: "0.82rem" }}>{formatFcfa(a.montantEncaisseFcfa)}</td>
                      <td style={{ fontSize: "0.82rem" }} className={a.resteAPayerFcfa > 0 ? "erreur" : ""}>
                        {formatFcfa(a.resteAPayerFcfa)}
                      </td>
                      <td className="no-print"></td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
