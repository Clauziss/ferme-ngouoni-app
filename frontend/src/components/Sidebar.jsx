import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpg";

const LIENS = [
  { to: "/", label: "Tableau de bord", icone: "📊", tip: "Vue d'ensemble : rentabilité et alertes", exact: true },
  { to: "/analyse", label: "Analyse", icone: "🔎", tip: "Filtrer par type et période" },
  { to: "/lots", label: "Cheptel", icone: "🐔", tip: "Gérer les groupes d'animaux" },
  { to: "/production-oeufs", label: "Production œufs", icone: "🥚", tip: "Saisie quotidienne de la ponte (cartons/palettes)" },
  { to: "/production-chair", label: "Suivi de masse", icone: "🍗", tip: "Suivi de poids par type d'animal" },
  { to: "/reproduction", label: "Reproduction", icone: "🐣", tip: "Couvées et taux d'éclosion" },
  { to: "/depenses", label: "Dépenses", icone: "💰", tip: "Aliment, santé, main d'œuvre..." },
  { to: "/ventes", label: "Ventes", icone: "🧺", tip: "Volaille, viande et œufs vendus" },
  { to: "/abonnes", label: "Abonnés", icone: "👥", tip: "Clients réguliers" },
  { to: "/rapport-clients", label: "Rapport clients", icone: "🧾", tip: "Achats des clients sur une période" },
  { to: "/rappels", label: "Rappels", icone: "🔔", tip: "Vaccinations et alertes programmées" },
];

const LIEN_UTILISATEURS = { to: "/utilisateurs", label: "Comptes", icone: "🔑", tip: "Créer des comptes pour ton équipe" };

export default function Sidebar() {
  const { utilisateur, deconnexion } = useAuth();
  return (
    <aside className="sidebar">
      <div className="marque">
        <img src={logo} alt="Logo Ferme de Ngouoni" />
        <h1>Ferme de<br />Ngouoni</h1>
      </div>
      <span className="eyebrow">L'art du goût</span>
      <div className="arc-or"></div>
      <nav>
        {LIENS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.exact}
            data-tip={l.tip}
            className={({ isActive }) => (isActive ? "actif" : "")}
          >
            <span>{l.icone}</span> {l.label}
          </NavLink>
        ))}
        {utilisateur?.role === "admin" && (
          <NavLink
            to={LIEN_UTILISATEURS.to}
            data-tip={LIEN_UTILISATEURS.tip}
            className={({ isActive }) => (isActive ? "actif" : "")}
          >
            <span>{LIEN_UTILISATEURS.icone}</span> {LIEN_UTILISATEURS.label}
          </NavLink>
        )}
      </nav>
      <div className="profil-bas">
        <div className="nom">{utilisateur?.nom}</div>
        <div className="role">{utilisateur?.role}</div>
        <button className="bouton secondaire" style={{ color: "#F1EEE0", borderColor: "rgba(255,255,255,0.3)", width: "100%" }} onClick={deconnexion}>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
