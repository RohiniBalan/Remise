"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WholesalerSignupRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/business/signup?role=wholesaler");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF0000] border-t-transparent" />
        <p className="text-sm text-gray-400">Redirecting to business signup...</p>
      </div>
    </div>
  );
}