const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function requete(chemin, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const reponse = await fetch(`${BASE_URL}${chemin}`, { ...options, headers });
  if (reponse.status === 204) return null;
  const donnees = await reponse.json().catch(() => null);
  if (!reponse.ok) {
    throw new Error(donnees?.erreur || "Une erreur est survenue.");
  }
  return donnees;
}

export const api = {
  get: (chemin) => requete(chemin),
  post: (chemin, corps) => requete(chemin, { method: "POST", body: JSON.stringify(corps) }),
  put: (chemin, corps) => requete(chemin, { method: "PUT", body: JSON.stringify(corps) }),
  patch: (chemin, corps) => requete(chemin, { method: "PATCH", body: JSON.stringify(corps || {}) }),
  del: (chemin) => requete(chemin, { method: "DELETE" }),
};
