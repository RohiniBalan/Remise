"use client";

import { useEffect, useContext, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";

import { getRoleRedirectUrl } from "../../utils/authRedirect";

function GoogleSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ctx = useContext(AuthContext) as any;

  // Guards against re-running: without this, calling ctx.login() below
  // changes AuthContext's value identity, which re-triggers this effect
  // (since ctx is a dependency) → infinite "Maximum update depth exceeded" loop.
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;

    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (!token || !userParam) {
      hasRun.current = true;
      router.push('/login?error=missing_data');
      return;
    }

    try {
      // Next.js's searchParams.get() already URL-decodes the value once,
      // so a second decodeURIComponent() is redundant and can throw
      // (URIError: malformed URI) if the JSON ever contains a literal "%".
      const user = JSON.parse(userParam);

      hasRun.current = true;

      if (ctx?.login) {
        ctx.login(user, token);
      } else {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      window.dispatchEvent(new CustomEvent('authChange'));

      // Redirect based on actual user role stored in DB
      const destination = getRoleRedirectUrl(user.role);
      setTimeout(() => {
        router.push(destination);
      }, 1500);
    } catch (error) {
      hasRun.current = true;
      console.error('Error parsing user data:', error);
      router.push('/login?error=invalid_data');
    }
    // Intentionally NOT depending on ctx/router — this must run exactly once
    // per mount. The hasRun ref is the real guard; the array just needs to
    // avoid re-running when searchParams' identity happens to change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent mx-auto"></div>
        <h2 className="text-2xl font-medium text-white">Completing Google Sign-In...</h2>
        <p className="mt-2 text-gray-400">Please wait while we redirect you</p>
      </div>
    </div>
  );
}

export default function GoogleSuccess() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent mx-auto"></div>
          <h2 className="text-2xl font-medium text-white">Loading...</h2>
        </div>
      </div>
    }>
      <GoogleSuccessContent />
    </Suspense>
  );
}