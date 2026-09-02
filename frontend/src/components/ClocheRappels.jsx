import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function ClocheRappels() {
  const [rappelsDus, setRappelsDus] = useState([]);

  useEffect(() => {
    api.get("/rappels/dus").then(setRappelsDus).catch(() => {});
  }, []);

  return (
    <Link
      to="/rappels"
      className="badge-cloche"
      data-tip-bas={rappelsDus.length > 0 ? `${rappelsDus.length} rappel(s) en attente` : "Aucun rappel en attente"}
    >
      🔔 Rappels
      {rappelsDus.length > 0 && <span className="compte">{rappelsDus.length}</span>}
    </Link>
  );
}
