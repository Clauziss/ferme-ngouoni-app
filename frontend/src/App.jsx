import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar, { LIENS, LIEN_UTILISATEURS } from "./components/Sidebar";
import ClocheRappels from "./components/ClocheRappels";
import Connexion from "./pages/Connexion";
import TableauDeBord from "./pages/TableauDeBord";
import Analyse from "./pages/Analyse";
import Lots from "./pages/Lots";
import ProductionOeufs from "./pages/ProductionOeufs";
import ProductionChair from "./pages/ProductionChair";
import Vaccinations from "./pages/Vaccinations";
import Reproduction from "./pages/Reproduction";
import Depenses from "./pages/Depenses";
import Ventes from "./pages/Ventes";
import Abonnes from "./pages/Abonnes";
import RapportClients from "./pages/RapportClients";
import Releve from "./pages/Releve";
import GestionFinanciere from "./pages/GestionFinanciere";
import Rappels from "./pages/Rappels";
import Utilisateurs from "./pages/Utilisateurs";

// Titre affiché en haut de l'écran : on le déduit du chemin courant plutôt
// que de le répéter dans chaque page.
function TitreCourant() {
  const { pathname } = useLocation();
  const tous = [...LIENS, LIEN_UTILISATEURS];
  const lien =
    tous.find((l) => l.to === pathname) ||
    tous.find((l) => l.to !== "/" && pathname.startsWith(l.to));
  if (!lien) return <div />;
  return (
    <div className="titre-courant">
      <span aria-hidden="true">{lien.icone}</span>
      <span>{lien.label}</span>
    </div>
  );
}

function ZoneProtegee({ children }) {
  const { utilisateur } = useAuth();
  if (!utilisateur) return <Navigate to="/connexion" replace />;
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="contenu">
        <div className="topbar">
          <TitreCourant />
          <ClocheRappels />
        </div>
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/" element={<ZoneProtegee><TableauDeBord /></ZoneProtegee>} />
      <Route path="/analyse" element={<ZoneProtegee><Analyse /></ZoneProtegee>} />
      <Route path="/lots" element={<ZoneProtegee><Lots /></ZoneProtegee>} />
      <Route path="/production-oeufs" element={<ZoneProtegee><ProductionOeufs /></ZoneProtegee>} />
      <Route path="/production-chair" element={<ZoneProtegee><ProductionChair /></ZoneProtegee>} />
      <Route path="/vaccinations" element={<ZoneProtegee><Vaccinations /></ZoneProtegee>} />
      <Route path="/reproduction" element={<ZoneProtegee><Reproduction /></ZoneProtegee>} />
      <Route path="/depenses" element={<ZoneProtegee><Depenses /></ZoneProtegee>} />
      <Route path="/ventes" element={<ZoneProtegee><Ventes /></ZoneProtegee>} />
      <Route path="/abonnes" element={<ZoneProtegee><Abonnes /></ZoneProtegee>} />
      <Route path="/rapport-clients" element={<ZoneProtegee><RapportClients /></ZoneProtegee>} />
      <Route path="/releve" element={<ZoneProtegee><Releve /></ZoneProtegee>} />
      <Route path="/finance" element={<ZoneProtegee><GestionFinanciere /></ZoneProtegee>} />
      <Route path="/rappels" element={<ZoneProtegee><Rappels /></ZoneProtegee>} />
      <Route path="/utilisateurs" element={<ZoneProtegee><Utilisateurs /></ZoneProtegee>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
