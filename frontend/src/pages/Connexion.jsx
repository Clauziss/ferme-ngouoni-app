import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, lireMessageConnexion } from "../context/AuthContext";
import logo from "../assets/logo.jpg";
import ChampMotDePasse from "../components/ChampMotDePasse";

export default function Connexion() {
  const { connexion } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [info] = useState(() => lireMessageConnexion());

  async function soumettre(e) {
    e.preventDefault();
    setErreur("");
    try {
      await connexion(email, motDePasse);
      navigate("/");
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <div className="ecran-connexion">
      <form className="carte-connexion" onSubmit={soumettre}>
        <img src={logo} alt="Logo Ferme de Ngouoni" className="logo-connexion" />
        <h1>Ferme de Ngouoni</h1>
        <span className="eyebrow-connexion">L'art du goût</span>
        <p className="sous">Connectez-vous pour gérer la ferme</p>
        {info && !erreur && <p className="info-session" role="status">{info}</p>}
        {erreur && <p className="erreur">{erreur}</p>}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Mot de passe
          <ChampMotDePasse value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required autoComplete="current-password" />
        </label>
        <button type="submit" className="bouton" style={{ width: "100%", marginTop: 6 }}>
          Se connecter
        </button>
      </form>
    </div>
  );
}
