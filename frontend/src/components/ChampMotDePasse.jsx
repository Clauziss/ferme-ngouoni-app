import React, { useState } from "react";

const ICONE_OEIL = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ICONE_OEIL_BARRE = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C5 19 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// Champ mot de passe avec un bouton pour afficher ou masquer ce qu'on tape.
// Le mot de passe reste masqué par défaut. Le bouton est de type "button" :
// il ne soumet jamais le formulaire.
export default function ChampMotDePasse({ value, onChange, required, minLength, autoComplete = "current-password" }) {
  const [visible, setVisible] = useState(false);
  const libelle = visible ? "Masquer le mot de passe" : "Afficher le mot de passe";

  return (
    <span className="champ-mdp">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="bascule-mdp"
        onClick={() => setVisible((v) => !v)}
        aria-label={libelle}
        aria-pressed={visible}
        title={libelle}
      >
        {visible ? ICONE_OEIL_BARRE : ICONE_OEIL}
      </button>
    </span>
  );
}
