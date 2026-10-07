import React from "react";
import EnteteImpression from "../components/EnteteImpression";
import { useInventaire, formaterPalettes, formaterDuree, formaterDelai } from "../utils/inventaire";

const statutPuce = (statut) => (statut === "Prêt à abattre" ? "ok" : statut === "Âge moyen" ? "neutre" : "neutre");

export default function Inventaire() {
  const { inventaire, erreur, recharger } = useInventaire();

  if (erreur) return <p className="erreur">{erreur}</p>;
  if (!inventaire) return <p>Chargement de l'inventaire…</p>;

  const { cheptel, oeufs } = inventaire;
  const dateReleve = new Date(inventaire.dateReleve).toLocaleString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div>
      <EnteteImpression titre="Inventaire de la ferme" sousTitre={`Situation au ${dateReleve}`} />

      <div className="entete-page">
        <div>
          <h2 style={{ fontSize: "1.3rem" }}>Inventaire</h2>
          <p style={{ color: "var(--texte-doux)", fontSize: "0.88rem", margin: "4px 0 0" }}>
            Situation au {dateReleve} : cheptel disponible et stock d'œufs.
          </p>
        </div>
        <div className="no-print" style={{ display: "flex", gap: 10 }}>
          <button className="bouton secondaire" onClick={recharger}>↻ Actualiser</button>
          <button className="bouton secondaire" onClick={() => window.print()}>🖨️ Imprimer</button>
        </div>
      </div>

      <div className="grille-stats">
        <div className="carte-oeuf">
          <div className="label">🐔 Sujets disponibles</div>
          <div className="valeur">{cheptel.total.disponible}</div>
          <div className="contexte">{cheptel.total.bandes} bande(s) au registre</div>
        </div>
        <div className="carte-oeuf">
          <div className="label">📦 Stock total d'œufs</div>
          <div className="valeur" style={{ fontSize: "1.35rem" }}>{formaterPalettes(oeufs.total.stockPalettes)}</div>
          <div className="contexte">Poule + Pintade + Canard</div>
        </div>
        <div className="carte-oeuf">
          <div className="label">🥚 Œufs produits (cumul)</div>
          <div className="valeur" style={{ fontSize: "1.35rem" }}>{formaterPalettes(oeufs.total.produitPalettes)}</div>
          <div className="contexte">dont {oeufs.total.cassesNombre} cassé(s)</div>
        </div>
      </div>

      <div className="panneau">
        <h2>Cheptel par type</h2>
        <p className="sous-titre-panneau">
          Disponible = entrés − morts − vendus (volaille vivante et effilée). Les ventes sont déduites par type
          d'animal, pas par bande.
        </p>
        <table>
          <thead>
            <tr>
              <th>Type</th><th>Bandes</th><th>Entrés</th><th>Morts</th><th>Vendus</th><th>Disponible</th>
            </tr>
          </thead>
          <tbody>
            {cheptel.parType.map((t) => (
              <tr key={t.type}>
                <td>{t.type}</td>
                <td>{t.bandes}</td>
                <td>{t.entres}</td>
                <td>{t.morts}</td>
                <td>{t.vendus}</td>
                <td><strong>{t.disponible}</strong></td>
              </tr>
            ))}
            <tr className="ligne-total">
              <td>Total</td>
              <td>{cheptel.total.bandes}</td>
              <td>{cheptel.total.entres}</td>
              <td>{cheptel.total.morts}</td>
              <td>{cheptel.total.vendus}</td>
              <td>{cheptel.total.disponible}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="panneau">
        <h2>Détail par bande</h2>
        <p className="sous-titre-panneau">
          Le statut est calculé d'après l'âge réel de la bande (âge à l'arrivée + temps passé à la ferme).
          L'effectif affiché déduit seulement la mortalité de la bande.
        </p>
        {cheptel.bandes.length === 0 ? (
          <p style={{ color: "var(--texte-doux)" }}>Aucune bande enregistrée dans le cheptel.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th><th>Entrée le</th><th>Âge à l'arrivée</th><th>Temps à la ferme</th><th>Statut</th>
                <th>Effectif initial</th><th>Morts</th><th>Après mortalité</th>
              </tr>
            </thead>
            <tbody>
              {cheptel.bandes.map((b) => (
                <tr key={b.id}>
                  <td>{b.type}</td>
                  <td>{b.dateEntree}</td>
                  <td>{b.ageArriveeJours > 0 ? formaterDuree(b.ageArriveeJours) : "1 jour ou moins"}</td>
                  <td>{formaterDuree(b.joursALaFerme)}</td>
                  <td>
                    <span className={`puce ${statutPuce(b.statut)}`}>{b.statut}</span>
                    {b.prochainStatut && (
                      <div className="sous-texte">→ {b.prochainStatut} dans {formaterDelai(b.joursAvantProchainStatut)}</div>
                    )}
                  </td>
                  <td>{b.effectifInitial}</td>
                  <td>{b.mortaliteCumulee}</td>
                  <td>{b.effectifApresMortalite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panneau">
        <h2>Œufs : produits et en stock</h2>
        <p className="sous-titre-panneau">
          1 carton = 12 palettes = 360 œufs. Stock = produit − livré, par espèce. Les œufs cassés sont comptés à part.
        </p>
        <table>
          <thead>
            <tr><th>Œufs de</th><th>Produits</th><th>Livrés</th><th>En stock</th><th>Cassés</th></tr>
          </thead>
          <tbody>
            {oeufs.parEspece.map((e) => (
              <tr key={e.espece}>
                <td>{e.espece}</td>
                <td>{formaterPalettes(e.produitPalettes)}</td>
                <td>{formaterPalettes(e.livrePalettes)}</td>
                <td><strong>{formaterPalettes(e.stockPalettes)}</strong></td>
                <td>{e.cassesNombre} œuf(s)</td>
              </tr>
            ))}
            <tr className="ligne-total">
              <td>Stock total</td>
              <td>{formaterPalettes(oeufs.total.produitPalettes)}</td>
              <td>{formaterPalettes(oeufs.total.livrePalettes)}</td>
              <td>{formaterPalettes(oeufs.total.stockPalettes)}</td>
              <td>{oeufs.total.cassesNombre} œuf(s)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
