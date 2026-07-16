"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function useWakeUp() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const wakeUp = async () => {
      try {
        console.log("Calling Wake-up API...");

        const res = await axios.get(`${API}/wake-up`, {
          timeout: 70000,
        });

        console.log(res.data);

        // If every service is awake
        if (res.data.success) {
          console.log("All services are awake.");

          await new Promise((resolve) => setTimeout(resolve, 1500));

          setLoading(false);
          return;
        }

        console.log("Some services are still sleeping.");

      } catch (err) {
        console.error("Wake-up failed:", err);
      }

      // Retry after 5 seconds
      console.log("Retrying in 5 seconds...");

      setTimeout(wakeUp, 5000);
    };

    wakeUp();
  }, []);

  return loading;
}
