import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

// Délai d'inactivité avant déconnexion automatique (doit correspondre à SESSION_MINUTES côté serveur).
export const DELAI_INACTIVITE_MS = 10 * 60 * 1000;
const CLE_ACTIVITE = "derniereActivite";
const CLE_MESSAGE = "messageConnexion";

function lire(cle) {
  try { return localStorage.getItem(cle); } catch { return null; }
}

function utilisateurEnregistre() {
  const brut = lire("utilisateur");
  if (!brut || !lire("token")) return null;
  // Rouvrir le navigateur après plus de 10 min d'absence : session close.
  const derniere = Number(lire(CLE_ACTIVITE)) || 0;
  if (Date.now() - derniere > DELAI_INACTIVITE_MS) return null;
  try { return JSON.parse(brut); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(() => {
    const u = utilisateurEnregistre();
    if (!u && lire("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("utilisateur");
      localStorage.setItem(CLE_MESSAGE, "Votre session a expiré après 10 minutes d'inactivité. Reconnectez-vous.");
    }
    return u;
  });

  async function connexion(email, motDePasse) {
    const donnees = await api.post("/auth/connexion", { email, motDePasse });
    localStorage.setItem("token", donnees.token);
    localStorage.setItem("utilisateur", JSON.stringify(donnees.utilisateur));
    localStorage.setItem(CLE_ACTIVITE, String(Date.now()));
    localStorage.removeItem(CLE_MESSAGE);
    setUtilisateur(donnees.utilisateur);
  }

  const deconnexion = useCallback((message) => {
    localStorage.removeItem("token");
    localStorage.removeItem("utilisateur");
    localStorage.removeItem(CLE_ACTIVITE);
    if (typeof message === "string") localStorage.setItem(CLE_MESSAGE, message);
    setUtilisateur(null);
  }, []);

  // Surveillance de l'inactivité (partagée entre les onglets via localStorage).
  useEffect(() => {
    if (!utilisateur) return undefined;

    const MESSAGE = "Votre session a expiré après 10 minutes d'inactivité. Reconnectez-vous.";
    let dernierEcrit = 0;
    function activite() {
      const maintenant = Date.now();
      if (maintenant - dernierEcrit < 1000) return; // limite les écritures
      dernierEcrit = maintenant;
      try { localStorage.setItem(CLE_ACTIVITE, String(maintenant)); } catch { /* ignoré */ }
    }
    function verifier() {
      const derniere = Number(lire(CLE_ACTIVITE)) || 0;
      if (Date.now() - derniere > DELAI_INACTIVITE_MS) deconnexion(MESSAGE);
    }
    function surSessionExpiree() { deconnexion(MESSAGE); }
    function surStockage(e) {
      // Déconnexion faite dans un autre onglet.
      if (e.key === "token" && !e.newValue) setUtilisateur(null);
    }

    activite();
    const evenements = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"];
    evenements.forEach((nom) => window.addEventListener(nom, activite, { passive: true }));
    window.addEventListener("session-expiree", surSessionExpiree);
    window.addEventListener("storage", surStockage);
    document.addEventListener("visibilitychange", verifier);
    const minuteur = setInterval(verifier, 15000);

    return () => {
      evenements.forEach((nom) => window.removeEventListener(nom, activite));
      window.removeEventListener("session-expiree", surSessionExpiree);
      window.removeEventListener("storage", surStockage);
      document.removeEventListener("visibilitychange", verifier);
      clearInterval(minuteur);
    };
  }, [utilisateur, deconnexion]);

  return (
    <AuthContext.Provider value={{ utilisateur, connexion, deconnexion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Message d'information à afficher sur la page de connexion (effacé à la prochaine connexion réussie).
export function lireMessageConnexion() {
  return lire(CLE_MESSAGE) || "";
}
