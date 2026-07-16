"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function useWakeUp() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const wakeUp = async () => {
      try {
        await axios.get(`${API}/wake-up`, {
          timeout: 70000,
        });

        // Keep the modal visible for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        console.error("Wake-up failed", err);

        // Even if wake-up fails, don't block the app forever.
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      setLoading(false);
    };

    wakeUp();
  }, []);

  return loading;
}