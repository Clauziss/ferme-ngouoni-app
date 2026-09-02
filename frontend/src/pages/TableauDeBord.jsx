import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { api } from "../api/client";
import EnteteImpression from "../components/EnteteImpression";

const formatFcfa = (n) => (n == null ? "—" : `${Math.round(n).toLocaleString("fr-FR")} FCFA`);
const formatPct = (n) => (n == null ? "—" : `${(n * 100).toFixed(1)} %`);

const PANNEAUX = [
  { cle: "tendance", label: "Tendance sur 30 jours" },
  { cle: "depensesSujet", label: "Dépenses par poulailler" },
  { cle: "ventesType", label: "Ventes par type de produit" },
  { cle: "ventesOeufs", label: "Ventes d'œufs — En gros / En détail" },
  { cle: "ventesSujet", label: "Ventes par animal" },
  { cle: "ponte", label: "Suivi de la ponte" },
];

function chargerPreferencesPanneaux() {
  try {
    const brut = localStorage.getItem("tableauDeBordPanneaux");
    if (brut) return JSON.parse(brut);
  } catch (e) { /* ignore */ }
  return Object.fromEntries(PANNEAUX.map((p) => [p.cle, true]));
}

function BulleGraphique({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: "#0B2216", color: "#FBF7EC", padding: "10px 14px",
      borderRadius: 10, fontSize: "0.8rem", boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
    }}>
      <div style={{ marginBottom: 4, opacity: 0.7 }}>{new Date(label).toLocaleDateString("fr-FR")}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name} : {formatFcfa(p.value)}
        </div>
      ))}
    </div>
  );
}

export default function TableauDeBord() {
  const [rentabilite, setRentabilite] = useState(null);
  const [reforme, setReforme] = useState(null);
  const [tendance, setTendance] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [panneaux, setPanneaux] = useState(chargerPreferencesPanneaux);
  const [reglagesOuverts, setReglagesOuverts] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/rentabilite"),
      api.get("/dashboard/alerte-reforme"),
      api.get("/dashboard/tendance"),
    ])
      .then(([r, a, t]) => {
        setRentabilite(r);
        setReforme(a);
        setTendance(t);
      })
      .finally(() => setChargement(false));
  }, []);

  function basculerPanneau(cle) {
    setPanneaux((p) => {
      const suivant = { ...p, [cle]: !p[cle] };
      localStorage.setItem("tableauDeBordPanneaux", JSON.stringify(suivant));
      return suivant;
    });
  }

  if (chargement || !rentabilite || !reforme) return <p>Chargement du tableau de bord…</p>;

  return (
    <div>
      <EnteteImpression titre="Tableau de bord" />
      <div className="entete-page">
        <div />
        <div className="no-print" style={{ display: "flex", gap: 10 }}>
          <button className="bouton secondaire" onClick={() => setReglagesOuverts((v) => !v)}>
            ⚙️ Personnaliser
          </button>
          <button className="bouton secondaire" onClick={() => window.print()}>🖨️ Imprimer</button>
        </div>
      </div>

      {reglagesOuverts && (
        <div className="panneau no-print">
          <h2>Quels panneaux afficher ?</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px", marginTop: 10 }}>
            {PANNEAUX.map((p) => (
              <label key={p.cle} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", cursor: "pointer" }}>
                <input type="checkbox" checked={!!panneaux[p.cle]} onChange={() => basculerPanneau(p.cle)} />
                {p.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="grille-stats">
        <div className="carte-oeuf" data-tip="Toutes ventes, toutes périodes">
          <div className="label">🧺 Ventes totales</div>
          <div className="valeur">{formatFcfa(rentabilite.totalVentesFcfa)}</div>
        </div>
        <div className="carte-oeuf" data-tip="Aliment, santé, main d'œuvre...">
          <div className="label">💰 Dépenses totales</div>
          <div className="valeur">{formatFcfa(rentabilite.totalDepensesFcfa)}</div>
        </div>
        <div className="carte-oeuf" data-tip="Ventes − dépenses">
          <div className="label">📈 Marge globale</div>
          <div className={`valeur ${rentabilite.margeFcfa < 0 ? "negatif" : ""}`}>{formatFcfa(rentabilite.margeFcfa)}</div>
        </div>
        <div className="carte-oeuf" data-tip="Ce qui reste à encaisser sur les ventes">
          <div className="label">⏳ Reste à encaisser</div>
          <div className={`valeur ${rentabilite.totalResteAPayerFcfa > 0 ? "negatif" : ""}`}>
            {formatFcfa(rentabilite.totalResteAPayerFcfa)}
          </div>
        </div>
        <div className="carte-oeuf" data-tip="Œufs pondus / effectif de pondeuses, moyenne 30 jours">
          <div className="label">🐣 Taux de ponte</div>
          <div className={`valeur ${reforme.statut === "À surveiller" ? "negatif" : ""}`}>
            {formatPct(reforme.tauxPonteMoyen)}
          </div>
        </div>
      </div>

      {panneaux.tendance && (
        <div className="panneau">
          <h2>Tendance sur 30 jours</h2>
          <p className="sous-titre-panneau">Ventes et dépenses cumulées jour par jour.</p>
          <div className="graphique-legende">
            <span><span className="point-legende" style={{ background: "#1F4A2E" }}></span>Ventes</span>
            <span><span className="point-legende" style={{ background: "#B33F2E" }}></span>Dépenses</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={tendance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#E7DFC7" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                tick={{ fontSize: 11, fill: "#746F5C" }}
                axisLine={{ stroke: "#E7DFC7" }}
                tickLine={false}
                interval={4}
              />
              <YAxis tick={{ fontSize: 11, fill: "#746F5C" }} axisLine={false} tickLine={false} width={70}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<BulleGraphique />} />
              <Line type="monotone" dataKey="ventesFcfa" name="Ventes" stroke="#1F4A2E" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} animationDuration={900} />
              <Line type="monotone" dataKey="depensesFcfa" name="Dépenses" stroke="#B33F2E" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} animationDuration={900} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {panneaux.depensesSujet && (
        <div className="panneau">
          <h2>Dépenses par poulailler</h2>
          <table>
            <thead><tr><th>Poulailler</th><th>Total dépenses</th></tr></thead>
            <tbody>
              {rentabilite.depensesParPoulailler.map((d) => (
                <tr key={d.poulailler}><td>{d.poulailler}</td><td>{formatFcfa(d.totalDepensesFcfa)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {panneaux.ventesType && (
        <div className="panneau">
          <h2>Ventes par type de produit</h2>
          <table>
            <thead><tr><th>Type</th><th>Total ventes</th></tr></thead>
            <tbody>
              {rentabilite.ventesParType.map((v) => (
                <tr key={v.typeProduit}><td>{v.typeProduit}</td><td>{formatFcfa(v.totalVentesFcfa)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {panneaux.ventesOeufs && (
        <div className="panneau">
          <h2>Ventes d'œufs — En gros vs En détail</h2>
          <table>
            <thead><tr><th>Type de client</th><th>Total ventes</th></tr></thead>
            <tbody>
              {rentabilite.ventesOeufsParSousType.map((v) => (
                <tr key={v.sousType}><td>{v.sousType}</td><td>{formatFcfa(v.totalVentesFcfa)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {panneaux.ventesSujet && (
        <div className="panneau">
          <h2>Ventes par animal</h2>
          <table>
            <thead><tr><th>Animal</th><th>Total ventes</th></tr></thead>
            <tbody>
              {rentabilite.ventesParSujet.map((v) => (
                <tr key={v.sujet}><td>{v.sujet}</td><td>{formatFcfa(v.totalVentesFcfa)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {panneaux.ponte && (
        <div className="panneau">
          <h2>Suivi de la ponte — pondeuses (seuil : {formatPct(reforme.seuil)})</h2>
          <p className="sous-titre-panneau">
            Taux de ponte moyen sur 30 jours ({reforme.effectifTotal ?? "—"} pondeuses au Cheptel).
          </p>
          <div className="valeur" style={{ marginBottom: 8 }}>{formatPct(reforme.tauxPonteMoyen)}</div>
          <span className={`puce ${reforme.statut === "À surveiller" ? "alerte" : reforme.statut === "OK" ? "ok" : "neutre"}`}>
            {reforme.statut}
          </span>
          <p style={{ fontSize: "0.8rem", color: "var(--texte-doux)", marginTop: 10 }}>
            Cet indicateur devient fiable après 4-6 semaines de saisie régulière de la production d'œufs.
          </p>
        </div>
      )}
    </div>
  );
}
