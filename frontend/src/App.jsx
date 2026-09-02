import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import ClocheRappels from "./components/ClocheRappels";
import Connexion from "./pages/Connexion";
import TableauDeBord from "./pages/TableauDeBord";
import Analyse from "./pages/Analyse";
import Lots from "./pages/Lots";
import ProductionOeufs from "./pages/ProductionOeufs";
import ProductionChair from "./pages/ProductionChair";
import Reproduction from "./pages/Reproduction";
import Depenses from "./pages/Depenses";
import Ventes from "./pages/Ventes";
import Abonnes from "./pages/Abonnes";
import RapportClients from "./pages/RapportClients";
import Rappels from "./pages/Rappels";
import Utilisateurs from "./pages/Utilisateurs";

function ZoneProtegee({ children }) {
  const { utilisateur } = useAuth();
  if (!utilisateur) return <Navigate to="/connexion" replace />;
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="contenu">
        <div className="topbar">
          <div />
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
      <Route path="/reproduction" element={<ZoneProtegee><Reproduction /></ZoneProtegee>} />
      <Route path="/depenses" element={<ZoneProtegee><Depenses /></ZoneProtegee>} />
      <Route path="/ventes" element={<ZoneProtegee><Ventes /></ZoneProtegee>} />
      <Route path="/abonnes" element={<ZoneProtegee><Abonnes /></ZoneProtegee>} />
      <Route path="/rapport-clients" element={<ZoneProtegee><RapportClients /></ZoneProtegee>} />
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
