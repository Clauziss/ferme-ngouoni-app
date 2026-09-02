import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

// Page générique de gestion CRUD, configurée par entité (voir pages/*.jsx).
// Évite de réécrire le même tableau + formulaire pour chacun des 7 modules.
export default function EntityPage({ titre, description, endpoint, colonnes, champs, transformerAvantEnvoi }) {
  const { utilisateur } = useAuth();
  const [items, setItems] = useState([]);
  const [optionsRef, setOptionsRef] = useState({}); // ex: { lotId: [...lots] }
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [valeurs, setValeurs] = useState({});
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  async function chargerItems() {
    setChargement(true);
    try {
      const data = await api.get(endpoint);
      setItems(data);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  async function chargerOptionsReference() {
    const refs = {};
    for (const champ of champs) {
      if (champ.optionsEndpoint) {
        const data = await api.get(champ.optionsEndpoint).catch(() => []);
        refs[champ.name] = data;
      }
    }
    setOptionsRef(refs);
  }

  useEffect(() => {
    chargerItems();
    chargerOptionsReference();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  function majValeur(nom, val) {
    setValeurs((v) => ({ ...v, [nom]: val }));
  }

  async function soumettre(e) {
    e.preventDefault();
    setErreur("");
    try {
      await api.post(endpoint, transformerAvantEnvoi ? transformerAvantEnvoi(valeurs) : valeurs);
      setValeurs({});
      setFormulaireOuvert(false);
      chargerItems();
    } catch (e2) {
      setErreur(e2.message);
    }
  }

  async function supprimer(id) {
    if (!window.confirm("Supprimer cette ligne ?")) return;
    try {
      await api.del(`${endpoint}/${id}`);
      chargerItems();
    } catch (e) {
      setErreur(e.message);
    }
  }

  return (
    <div>
      <div className="entete-page">
        <div>
          <h2 style={{ fontSize: "1.3rem" }}>{titre}</h2>
          {description && <p style={{ color: "var(--texte-doux)", fontSize: "0.88rem", margin: "4px 0 0" }}>{description}</p>}
        </div>
        <button className="bouton" onClick={() => setFormulaireOuvert((v) => !v)}>
          {formulaireOuvert ? "Fermer" : "+ Ajouter"}
        </button>
      </div>

      {erreur && <p className="erreur">{erreur}</p>}

      {formulaireOuvert && (
        <form className="panneau" onSubmit={soumettre}>
          <div className="formulaire">
            {champs
              .filter((champ) => !champ.visibleSi || champ.visibleSi(valeurs))
              .map((champ) => (
              <label key={champ.id || champ.name}>
                {typeof champ.label === "function" ? champ.label(valeurs) : champ.label}
                {champ.type === "select" || champ.optionsEndpoint ? (
                  <select
                    required={champ.required}
                    value={valeurs[champ.name] || ""}
                    onChange={(e) => majValeur(champ.name, e.target.value)}
                  >
                    <option value="">—</option>
                    {champ.optionsEndpoint
                      ? (optionsRef[champ.name] || []).map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt[champ.optionLabel] || opt.idLot || opt.nom}
                          </option>
                        ))
                      : (champ.options || []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                  </select>
                ) : champ.calcule ? (
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={champ.calcule(valeurs)}
                    style={{ background: "#F1EDE0", color: "var(--texte-doux)", cursor: "default" }}
                  />
                ) : champ.type === "textarea" ? (
                  <textarea
                    rows={2}
                    placeholder={champ.placeholder}
                    required={champ.required}
                    value={valeurs[champ.name] || ""}
                    onChange={(e) => majValeur(champ.name, e.target.value)}
                    style={{
                      padding: "8px 10px", border: "1px solid var(--bordure)", borderRadius: 8,
                      fontFamily: "var(--font-corps)", fontSize: "0.9rem", resize: "vertical",
                    }}
                  />
                ) : (
                  <input
                    type={champ.type || "text"}
                    step={champ.type === "number" ? "any" : undefined}
                    min={champ.min}
                    max={champ.max}
                    placeholder={champ.placeholder}
                    required={champ.required}
                    value={valeurs[champ.name] || ""}
                    onChange={(e) => majValeur(champ.name, e.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
          <button type="submit" className="bouton">Enregistrer</button>
        </form>
      )}

      <div className="panneau">
        {chargement ? (
          <p>Chargement…</p>
        ) : items.length === 0 ? (
          <p style={{ color: "var(--texte-doux)" }}>Aucune donnée pour l'instant. Ajoutez la première ligne ci-dessus.</p>
        ) : (
          <table>
            <thead>
              <tr>
                {colonnes.map((c) => <th key={c.key}>{c.label}</th>)}
                {utilisateur?.role === "admin" && <th></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  {colonnes.map((c) => (
                    <td key={c.key}>{c.render ? c.render(item) : item[c.key]}</td>
                  ))}
                  {utilisateur?.role === "admin" && (
                    <td>
                      <button className="bouton danger" style={{ padding: "4px 10px", fontSize: "0.78rem" }} onClick={() => supprimer(item.id)}>
                        Supprimer
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
