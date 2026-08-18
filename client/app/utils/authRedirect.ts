export function getRoleRedirectUrl(role?: string | null): string {
  if (!role) return "/";
  const normalizedRole = role.toLowerCase().trim();

  if (normalizedRole === "admin") return "/admin/dashboard";
  if (normalizedRole === "store_owner") return "/store/dashboard";
  if (normalizedRole === "wholesaler" || normalizedRole === "whole_saler") return "/wholesaler/dashboard";
  if (normalizedRole === "home_business") return "/home-business/dashboard";
  
  // Default destination for customer / user and any unknown roles
  return "/";
}
