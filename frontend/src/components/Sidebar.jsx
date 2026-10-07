import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpg";

export const LIENS = [
  { to: "/", label: "Tableau de bord", icone: "📊", tip: "Vue d'ensemble : rentabilité et alertes", exact: true },
  { to: "/analyse", label: "Analyse", icone: "🔎", tip: "Filtrer par type et période" },
  { to: "/lots", label: "Cheptel", icone: "🐔", tip: "Gérer les groupes d'animaux" },
  { to: "/inventaire", label: "Inventaire", icone: "📦", tip: "Cheptel disponible et stock d'œufs" },
  { to: "/production-oeufs", label: "Production œufs", icone: "🥚", tip: "Saisie quotidienne de la ponte (cartons/palettes)" },
  { to: "/production-chair", label: "Suivi de masse", icone: "🍗", tip: "Suivi de poids par type d'animal" },
  { to: "/vaccinations", label: "Suivi des vaccins", icone: "💉", tip: "Vaccinations par bande, avec rappels" },
  { to: "/reproduction", label: "Reproduction", icone: "🐣", tip: "Couvées et taux d'éclosion" },
  { to: "/depenses", label: "Dépenses", icone: "💰", tip: "Aliment, santé, main d'œuvre..." },
  { to: "/ventes", label: "Ventes", icone: "🧺", tip: "Volaille, viande et œufs vendus" },
  { to: "/abonnes", label: "Abonnés", icone: "👥", tip: "Clients réguliers" },
  { to: "/rapport-clients", label: "Rapport clients", icone: "🧾", tip: "Achats des clients sur une période" },
  { to: "/releve", label: "Relevés", icone: "📋", tip: "Mouvements par jour, par mois ou sur une période" },
  { to: "/finance", label: "Gestion financière", icone: "🏦", tip: "Trésorerie, coût de revient, résultat, rentabilité" },
  { to: "/rappels", label: "Rappels", icone: "🔔", tip: "Vaccinations et alertes programmées" },
];

export const LIEN_UTILISATEURS = { to: "/utilisateurs", label: "Comptes", icone: "🔑", tip: "Créer des comptes pour ton équipe" };

// Sur grand écran, la barre est fixe à gauche. Sur tablette portrait et
// téléphone, c'est un tiroir : l'état (ouvert/fermé) est porté par App.jsx,
// car le bouton ☰ qui l'ouvre se trouve dans la barre du haut.
// Place la bulle d'info à droite de l'élément survolé (elle est en position « fixed »).
function placerBulle(e) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--tip-x", `${r.right}px`);
  e.currentTarget.style.setProperty("--tip-y", `${r.top + r.height / 2}px`);
}

export default function Sidebar({ ouvert = false, onFermer = () => {} }) {
  const { utilisateur, deconnexion } = useAuth();

  return (
    <>
    {ouvert && <div className="voile-menu" onClick={onFermer} aria-hidden="true" />}
    <aside id="menu-principal" className={`sidebar${ouvert ? " ouverte" : ""}`} aria-label="Menu principal">
      <button className="fermer-menu" onClick={onFermer} aria-label="Fermer le menu">✕</button>
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
            onMouseEnter={placerBulle}
            onFocus={placerBulle}
            className={({ isActive }) => (isActive ? "actif" : "")}
          >
            <span>{l.icone}</span> {l.label}
          </NavLink>
        ))}
        {utilisateur?.role === "admin" && (
          <NavLink
            to={LIEN_UTILISATEURS.to}
            data-tip={LIEN_UTILISATEURS.tip}
            onMouseEnter={placerBulle}
            onFocus={placerBulle}
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
    </>
  );
}
