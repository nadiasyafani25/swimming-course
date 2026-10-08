export const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  peserta: "/dashboard",
};

export const DEFAULT_HOME = "/dashboard";

export function homeForRole(role: string | null | undefined): string {
  if (!role) return DEFAULT_HOME;
  return ROLE_HOME[role] ?? DEFAULT_HOME;
}