export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;

  const token = window.localStorage.getItem('token');
  const storedUser = window.localStorage.getItem('user');

  if (!token || !storedUser) return false;

  try {
    const parsedUser = JSON.parse(storedUser);
    return Boolean(parsedUser && (parsedUser._id || parsedUser.id || parsedUser.email));
  } catch {
    return false;
  }
};

export const getLoginRedirectUrl = (fallbackPath?: string) => {
  if (typeof window === 'undefined') return '/login';

  const currentPath = fallbackPath || `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `/login?redirect=${encodeURIComponent(currentPath)}`;
};

export const redirectToLogin = (fallbackPath?: string) => {
  if (typeof window === 'undefined') return false;

  const loginUrl = getLoginRedirectUrl(fallbackPath);
  window.location.assign(loginUrl);
  return true;
};
