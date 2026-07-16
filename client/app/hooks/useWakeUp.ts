"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function useWakeUp() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("WakeUp Hook Started");
    console.log("API =", API);

    const wakeUp = async () => {
      try {
        console.log("Calling:", `${API}/wake-up`);

        const res = await axios.get(`${API}/wake-up`, {
          timeout: 70000,
        });

        console.log("WakeUp Success", res.data);

        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        console.error("WakeUp Error", err);

        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log("Closing Modal");

      setLoading(false);
    };

    wakeUp();
  }, []);

  return loading;
}