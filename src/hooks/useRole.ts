import { useState, useCallback } from "react";

export type AppRole = "student" | "ta";

const ROLE_KEY = "wisenet_role";

export function getRole(): AppRole {
  const stored = localStorage.getItem(ROLE_KEY);
  if (stored === "ta") return "ta";
  return "student";
}

export function setRole(role: AppRole) {
  localStorage.setItem(ROLE_KEY, role);
}

export function useRole() {
  const [role, _setRole] = useState<AppRole>(getRole);

  const switchRole = useCallback((newRole: AppRole) => {
    setRole(newRole);
    _setRole(newRole);
  }, []);

  return { role, switchRole, isTA: role === "ta", isStudent: role === "student" };
}
