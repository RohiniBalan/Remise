"use client";

import CashfreeModal, { CashfreeModalProps } from "./CashfreeModal";

export type RazorpayModalProps = CashfreeModalProps;

// Backwards-compatible alias component
export default function RazorpayModal(props: CashfreeModalProps) {
  return <CashfreeModal {...props} />;
}
