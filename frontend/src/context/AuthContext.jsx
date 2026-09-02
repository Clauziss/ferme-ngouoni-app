import React, { createContext, useContext, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(() => {
    const brut = localStorage.getItem("utilisateur");
    return brut ? JSON.parse(brut) : null;
  });

  async function connexion(email, motDePasse) {
    const donnees = await api.post("/auth/connexion", { email, motDePasse });
    localStorage.setItem("token", donnees.token);
    localStorage.setItem("utilisateur", JSON.stringify(donnees.utilisateur));
    setUtilisateur(donnees.utilisateur);
  }

  function deconnexion() {
    localStorage.removeItem("token");
    localStorage.removeItem("utilisateur");
    setUtilisateur(null);
  }

  return (
    <AuthContext.Provider value={{ utilisateur, connexion, deconnexion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
