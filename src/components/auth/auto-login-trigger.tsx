"use client";

import { useEffect } from "react";
import { autoLoginAction } from "@/app/actions/auth";

export function AutoLoginTrigger({ phone }: { phone: string }) {
  useEffect(() => {
    if (phone) {
      autoLoginAction(phone).catch(console.error);
    }
  }, [phone]);

  return null;
}
