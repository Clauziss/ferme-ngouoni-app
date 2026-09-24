import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import EnteteImpression from "../components/EnteteImpression";

const fcfa = (n) => (n == null ? "—" : `${Math.round(n).toLocaleString("fr-FR")} FCFA`);
const pct = (n) => (n == null ? "—" : `${(n * 100).toFixed(1)} %`);
const nb = (n, d = 1) => (n == null ? "—" : n.toFixed(d));

const ONGLETS = [
  { cle: "tresorerie", label: "Trésorerie et impayés", chemin: "/finance/tresorerie" },
  { cle: "coutRevient", label: "Coût de revient", chemin: "/finance/cout-revient" },
  { cle: "compteResultat", label: "Compte de résultat", chemin: "/finance/compte-resultat" },
  { cle: "seuil", label: "Seuil de rentabilité", chemin: "/finance/seuil-rentabilite" },
];

function ancienneteLibelle(jours) {
  if (jours === 0) return "aujourd'hui";
  if (jours === 1) return "1 jour";
  if (jours < 30) return `${jours} jours`;
  const mois = Math.floor(jours / 30);
  return mois === 1 ? "1 mois" : `${mois} mois`;
}

export default function GestionFinanciere() {
  const [onglet, setOnglet] = useState("tresorerie");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [donnees, setDonnees] = useState({});
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  async function charger(cle, params) {
    const p = params || { dateDebut, dateFin };
    const info = ONGLETS.find((o) => o.cle === cle);
    setChargement(true);
    setErreur("");
    const q = new URLSearchParams();
    if (p.dateDebut) q.set("dateDebut", p.dateDebut);
    if (p.dateFin) q.set("dateFin", p.dateFin);
    try {
      const r = await api.get(`${info.chemin}?${q.toString()}`);
      setDonnees((d) => ({ ...d, [cle]: r }));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger(onglet);
    // eslint-disable-next-line
  }, [onglet]);

  const d = donnees[onglet];
  const periodeLibelle = [
    dateDebut ? `du ${dateDebut}` : null,
    dateFin ? `au ${dateFin}` : null,
  ].filter(Boolean).join(" ") || "toutes périodes";

  return (
    <div>
      <EnteteImpression
        titre="Gestion financière"
        sousTitre={`${ONGLETS.find((o) => o.cle === onglet).label} — ${periodeLibelle}`}
      />

      <div className="entete-page">
        <div>
          <h2 style={{ fontSize: "1.3rem" }}>Gestion financière</h2>
          <p style={{ color: "var(--texte-doux)", fontSize: "0.88rem", margin: "4px 0 0" }}>
            Trésorerie, coût de revient, résultat et rentabilité de la ferme.
          </p>
        </div>
        <button className="bouton secondaire no-print" onClick={() => window.print()}>🖨️ Imprimer</button>
      </div>

      <div className="onglets no-print">
        {ONGLETS.map((o) => (
          <button
            key={o.cle}
            className={onglet === o.cle ? "actif" : ""}
            onClick={() => setOnglet(o.cle)}
          >
            {o.label}
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
        <button className="bouton" onClick={() => charger(onglet)} disabled={chargement}>
          {chargement ? "…" : "Appliquer"}
        </button>
      </div>

      {erreur && <p className="erreur">{erreur}</p>}
      {!d ? <p>Chargement…</p> : null}

      {/* ---------------- 1. TRÉSORERIE ET IMPAYÉS ---------------- */}
      {d && onglet === "tresorerie" && (
        <>
          <div className="grille-stats">
            <div className="carte-oeuf">
              <div className="label">💵 Encaissements</div>
              <div className="valeur">{fcfa(d.totalEncaisse)}</div>
            </div>
            <div className="carte-oeuf">
              <div className="label">💰 Décaissements</div>
              <div className="valeur">{fcfa(d.totalDecaisse)}</div>
            </div>
            <div className="carte-oeuf">
              <div className="label">🏦 Solde de caisse</div>
              <div className={`valeur ${d.soldeTresorerie < 0 ? "negatif" : ""}`}>
                {fcfa(d.soldeTresorerie)}
              </div>
            </div>
            <div className="carte-oeuf">
              <div className="label">⏳ Créances clients</div>
              <div className={`valeur ${d.creancesTotal > 0 ? "negatif" : ""}`}>
                {fcfa(d.creancesTotal)}
              </div>
            </div>
          </div>

          <div className="panneau">
            <h2>Créances par client</h2>
            <p className="sous-titre-panneau">
              Photo à l'instant présent — non filtrée par période, pour ne masquer aucun impayé ancien.
            </p>
            {d.creancesParClient.length === 0 ? (
              <p style={{ color: "var(--texte-doux)" }}>Aucun impayé. Tout est soldé.</p>
            ) : (
              <table>
                <thead>
                  <tr><th>Client</th><th>Ventes non soldées</th><th>Montant dû</th><th>Plus ancien impayé</th></tr>
                </thead>
                <tbody>
                  {d.creancesParClient.map((c) => (
                    <tr key={c.client}>
                      <td>{c.client}</td>
                      <td>{c.nbVentes}</td>
                      <td className="erreur">{fcfa(c.montantFcfa)}</td>
                      <td>
                        <span className={`puce ${c.plusAncien > 30 ? "alerte" : "neutre"}`}>
                          {ancienneteLibelle(c.plusAncien)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="ligne-total">
                    <td>Total</td>
                    <td>{d.nbImpayes}</td>
                    <td>{fcfa(d.creancesTotal)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {d.impayes.length > 0 && (
            <div className="panneau">
              <h2>Détail des ventes non soldées</h2>
              <table>
                <thead>
                  <tr><th>Date</th><th>Client</th><th>Produit</th><th>Total</th><th>Encaissé</th><th>Reste</th><th>Ancienneté</th></tr>
                </thead>
                <tbody>
                  {d.impayes.map((i) => (
                    <tr key={i.venteId}>
                      <td>{i.date}</td>
                      <td>{i.client}</td>
                      <td>{i.sujet} — {i.typeProduit}</td>
                      <td>{fcfa(i.montantTotalFcfa)}</td>
                      <td>{fcfa(i.montantEncaisseFcfa)}</td>
                      <td className="erreur">{fcfa(i.resteAPayerFcfa)}</td>
                      <td>{ancienneteLibelle(i.anciennete)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ---------------- 2. COÛT DE REVIENT ---------------- */}
      {d && onglet === "coutRevient" && (
        <>
          <div className="panneau">
            <h2>Coût de revient par type d'animal</h2>
            <p className="sous-titre-panneau">
              Charges du poulailler rapportées à l'effectif vivant, comparées au prix de vente moyen constaté.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Animal</th><th>Effectif</th><th>Charges</th>
                  <th>Coût par sujet</th><th>Prix de vente moyen</th><th>Marge par sujet</th>
                </tr>
              </thead>
              <tbody>
                {d.parSujet.map((s) => (
                  <tr key={s.sujet}>
                    <td>{s.sujet}</td>
                    <td>{s.effectif}</td>
                    <td>{fcfa(s.chargesFcfa)}</td>
                    <td>{fcfa(s.coutUnitaire)}</td>
                    <td>{fcfa(s.prixVenteMoyen)}</td>
                    <td className={s.margeUnitaire != null && s.margeUnitaire < 0 ? "erreur" : ""}>
                      {fcfa(s.margeUnitaire)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panneau">
            <h2>Coût de revient des œufs</h2>
            <p className="sous-titre-panneau">
              Charges du poulailler « Pondeuses réforme » rapportées à la production d'œufs de la période.
            </p>
            <div className="grille-stats">
              <div className="carte-oeuf">
                <div className="label">Charges pondeuses</div>
                <div className="valeur" style={{ fontSize: "1.3rem" }}>{fcfa(d.oeufs.chargesFcfa)}</div>
              </div>
              <div className="carte-oeuf">
                <div className="label">Cartons produits</div>
                <div className="valeur" style={{ fontSize: "1.3rem" }}>{nb(d.oeufs.cartonsProduits)}</div>
              </div>
              <div className="carte-oeuf">
                <div className="label">Coût par carton</div>
                <div className="valeur" style={{ fontSize: "1.3rem" }}>{fcfa(d.oeufs.coutParCarton)}</div>
              </div>
              <div className="carte-oeuf">
                <div className="label">Marge par carton</div>
                <div className={`valeur ${d.oeufs.margeParCarton != null && d.oeufs.margeParCarton < 0 ? "negatif" : ""}`} style={{ fontSize: "1.3rem" }}>
                  {fcfa(d.oeufs.margeParCarton)}
                </div>
              </div>
            </div>
            <table>
              <thead><tr><th>Indicateur</th><th>Valeur</th></tr></thead>
              <tbody>
                <tr><td>Œufs produits (unités)</td><td>{d.oeufs.oeufsProduits}</td></tr>
                <tr><td>Coût de revient par œuf</td><td>{fcfa(d.oeufs.coutParOeuf)}</td></tr>
                <tr><td>Cartons vendus (détail converti)</td><td>{nb(d.oeufs.cartonsVendus)}</td></tr>
                <tr><td>Prix de vente moyen par carton</td><td>{fcfa(d.oeufs.prixVenteMoyenCarton)}</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ---------------- 3. COMPTE DE RÉSULTAT ---------------- */}
      {d && onglet === "compteResultat" && (
        <>
          <div className="grille-stats">
            <div className="carte-oeuf">
              <div className="label">🧺 Produits (CA)</div>
              <div className="valeur">{fcfa(d.produits.total)}</div>
            </div>
            <div className="carte-oeuf">
              <div className="label">💰 Charges</div>
              <div className="valeur">{fcfa(d.charges.total)}</div>
            </div>
            <div className="carte-oeuf">
              <div className="label">📈 Résultat</div>
              <div className={`valeur ${d.resultat < 0 ? "negatif" : ""}`}>{fcfa(d.resultat)}</div>
            </div>
            <div className="carte-oeuf">
              <div className="label">% Taux de marge</div>
              <div className={`valeur ${d.tauxMarge != null && d.tauxMarge < 0 ? "negatif" : ""}`}>
                {pct(d.tauxMarge)}
              </div>
            </div>
          </div>

          <div className="panneau">
            <h2>Produits — ventes par famille</h2>
            <table>
              <thead><tr><th>Famille de produit</th><th>Montant</th><th>Part</th></tr></thead>
              <tbody>
                {d.produits.parType.map((p) => (
                  <tr key={p.libelle}>
                    <td>{p.libelle}</td>
                    <td>{fcfa(p.montant)}</td>
                    <td>{d.produits.total > 0 ? pct(p.montant / d.produits.total) : "—"}</td>
                  </tr>
                ))}
                <tr className="ligne-total">
                  <td>Total des produits</td>
                  <td>{fcfa(d.produits.total)}</td>
                  <td>100 %</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="panneau">
            <h2>Charges — dépenses par catégorie</h2>
            <table>
              <thead><tr><th>Catégorie</th><th>Montant</th><th>Part</th></tr></thead>
              <tbody>
                {d.charges.parCategorie.map((c) => (
                  <tr key={c.libelle}>
                    <td>{c.libelle}</td>
                    <td>{fcfa(c.montant)}</td>
                    <td>{d.charges.total > 0 ? pct(c.montant / d.charges.total) : "—"}</td>
                  </tr>
                ))}
                <tr className="ligne-total">
                  <td>Total des charges</td>
                  <td>{fcfa(d.charges.total)}</td>
                  <td>100 %</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="panneau">
            <h2>Résultat de la période</h2>
            <table>
              <tbody>
                <tr><td>Produits</td><td>{fcfa(d.produits.total)}</td></tr>
                <tr><td>Charges</td><td>− {fcfa(d.charges.total)}</td></tr>
                <tr className="ligne-total">
                  <td>{d.resultat >= 0 ? "Bénéfice" : "Perte"}</td>
                  <td>{fcfa(d.resultat)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ---------------- 4. SEUIL DE RENTABILITÉ ---------------- */}
      {d && onglet === "seuil" && (
        <>
          <div className="grille-stats">
            <div className="carte-oeuf">
              <div className="label">🧺 Chiffre d'affaires</div>
              <div className="valeur">{fcfa(d.totalProduits)}</div>
            </div>
            <div className="carte-oeuf">
              <div className="label">💰 Charges à couvrir</div>
              <div className="valeur">{fcfa(d.totalCharges)}</div>
            </div>
            <div className="carte-oeuf">
              <div className="label">{d.couvert ? "✅ Au-dessus du seuil" : "⚠️ Sous le seuil"}</div>
              <div className={`valeur ${d.couvert ? "" : "negatif"}`}>{fcfa(d.ecart)}</div>
            </div>
            <div className="carte-oeuf">
              <div className="label">📊 Taux de couverture</div>
              <div className={`valeur ${d.tauxCouverture != null && d.tauxCouverture < 1 ? "negatif" : ""}`}>
                {pct(d.tauxCouverture)}
              </div>
            </div>
          </div>

          <div className="panneau">
            <h2>Combien faut-il vendre pour couvrir les charges ?</h2>
            <p className="sous-titre-panneau">
              Quantité nécessaire si la totalité des charges devait être couverte par une seule famille de
              produit, au prix moyen constaté sur la période.
            </p>
            <table>
              <thead>
                <tr><th>Famille</th><th>Prix moyen constaté</th><th>Déjà vendu</th><th>Quantité pour couvrir les charges</th></tr>
              </thead>
              <tbody>
                {d.familles.map((f) => (
                  <tr key={f.libelle}>
                    <td>{f.libelle}</td>
                    <td>{fcfa(f.prixMoyen)}</td>
                    <td>{f.quantiteVendue == null ? "—" : `${nb(f.quantiteVendue)} ${f.unite}`}</td>
                    <td>
                      {f.quantitePourCouvrirCharges == null
                        ? "—"
                        : `${nb(f.quantitePourCouvrirCharges)} ${f.unite}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: "0.8rem", color: "var(--texte-doux)", marginTop: 12 }}>
              En pratique, les ventes se répartissent entre plusieurs familles : ces chiffres servent de
              repère, pas d'objectif à atteindre sur une seule ligne.
            </p>
          </div>

          {d.projection && (
            <div className="panneau">
              <h2>Rythme et projection</h2>
              <p className="sous-titre-panneau">
                Calculé sur les {d.projection.jours} jours de la période sélectionnée, à rythme constant.
              </p>
              <table>
                <tbody>
                  <tr><td>Produits par jour</td><td>{fcfa(d.projection.produitsParJour)}</td></tr>
                  <tr><td>Charges par jour</td><td>{fcfa(d.projection.chargesParJour)}</td></tr>
                  <tr><td>Résultat par jour</td><td className={d.projection.resultatParJour < 0 ? "erreur" : ""}>
                    {fcfa(d.projection.resultatParJour)}
                  </td></tr>
                  <tr className="ligne-total">
                    <td>Projection sur 30 jours</td>
                    <td>{fcfa(d.projection.projection30Jours)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {!d.projection && (
            <div className="panneau">
              <p style={{ color: "var(--texte-doux)" }}>
                Sélectionne une date de début et une date de fin pour obtenir la projection à rythme constant.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
