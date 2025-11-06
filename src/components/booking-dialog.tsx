"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Wallet, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ConnectedWallet } from "@privy-io/react-auth";
import { approveUsdtPayment, transferUsdtPayment } from "@/lib/usdt-payment";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  payoutAddress: string;
  usdtContractAddress: string;
  wallet: ConnectedWallet;
  onComplete: (transferTxHash: string) => void;
  onError: (error: Error) => void;
}

export default function BookingDialog({
  open,
  onOpenChange,
  amount,
  payoutAddress,
  usdtContractAddress,
  wallet,
  onComplete,
  onError,
}: BookingDialogProps) {
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null);
  const [transferTxHash, setTransferTxHash] = useState<string | null>(null);
  const [approvalCompleted, setApprovalCompleted] = useState(false);
  const [transferCompleted, setTransferCompleted] = useState(false);

  const formatAddress = (address: string): string => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleApprove = async () => {
    try {
      setApprovalLoading(true);
      const result = await approveUsdtPayment({
        wallet,
        payoutAddress,
        usdtContractAddress,
        amount,
      });
      setApprovalTxHash(result.approvalTxHash);
      setApprovalCompleted(true);
    } catch (error) {
      console.error("Failed to approve payment", error);
      onError(error as Error);
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleTransfer = async () => {
    try {
      setTransferLoading(true);
      const result = await transferUsdtPayment({
        wallet,
        payoutAddress,
        usdtContractAddress,
        amount,
      });
      setTransferTxHash(result.transferTxHash);
      setTransferCompleted(true);
      onComplete(result.transferTxHash);
    } catch (error) {
      console.error("Failed to transfer payment", error);
      onError(error as Error);
    } finally {
      setTransferLoading(false);
    }
  };

  const handleClose = () => {
    // Allow closing if transfer is completed or if no payment step has started
    if (
      transferCompleted ||
      (!approvalCompleted && !approvalLoading && !transferLoading)
    ) {
      // Reset state when closing
      setApprovalTxHash(null);
      setTransferTxHash(null);
      setApprovalCompleted(false);
      setTransferCompleted(false);
      onOpenChange(false);
    }
  };

  const canClose =
    transferCompleted ||
    (!approvalCompleted && !approvalLoading && !transferLoading);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="bg-gradient-to-br from-[oklch(0.145_0_0)] via-[oklch(0.165_0_0)] to-[oklch(0.125_0_0)] border-white/20 text-white"
        showCloseButton={canClose}
      >
        <DialogHeader>
          <DialogTitle
            className="text-2xl font-bold"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Complete Payment
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Follow these steps to complete your booking payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Details */}
          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">Amount</span>
              <span className="text-white font-bold text-lg">${amount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Payout Address</span>
              <span className="text-white font-mono text-sm">
                {formatAddress(payoutAddress)}
              </span>
            </div>
          </div>

          {/* Step 1: Approve */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  approvalCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-white/20 text-white/70"
                }`}
              >
                {approvalCompleted ? <Check className="w-5 h-5" /> : "1"}
              </div>
              <div className="flex-1">
                <h4
                  className="font-semibold text-white"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Approve Payment
                </h4>
                <p className="text-white/60 text-sm">
                  Approve ${amount} USDT to be transferred to the payout address
                </p>
              </div>
            </div>
            <motion.button
              onClick={handleApprove}
              disabled={approvalLoading || approvalCompleted}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                approvalCompleted
                  ? "bg-emerald-500/80 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              }`}
              style={{ fontFamily: "Inter, sans-serif" }}
              whileHover={approvalCompleted ? undefined : { scale: 1.02 }}
              whileTap={approvalCompleted ? undefined : { scale: 0.98 }}
            >
              {approvalLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Approving...
                </>
              ) : approvalCompleted ? (
                <>
                  <Check className="w-4 h-4" />
                  Approved
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  Approve ${amount}
                </>
              )}
            </motion.button>
            {approvalTxHash && (
              <a
                href={`https://etherscan.io/tx/${approvalTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
              >
                <ExternalLink className="w-3 h-3" />
                View Approval Transaction
              </a>
            )}
          </div>

          {/* Step 2: Transfer */}
          <div className="space-y-3 pt-4 border-t border-white/20">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  transferCompleted
                    ? "bg-emerald-500 text-white"
                    : !approvalCompleted
                    ? "bg-white/10 text-white/40"
                    : "bg-white/20 text-white/70"
                }`}
              >
                {transferCompleted ? <Check className="w-5 h-5" /> : "2"}
              </div>
              <div className="flex-1">
                <h4
                  className="font-semibold text-white"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Transfer Payment
                </h4>
                <p className="text-white/60 text-sm">
                  Complete the transfer to finalize your booking
                </p>
              </div>
            </div>
            <motion.button
              onClick={handleTransfer}
              disabled={
                !approvalCompleted || transferLoading || transferCompleted
              }
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                !approvalCompleted
                  ? "bg-white/10 cursor-not-allowed text-white/40"
                  : transferCompleted
                  ? "bg-emerald-500/80 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              }`}
              style={{ fontFamily: "Inter, sans-serif" }}
              whileHover={
                !approvalCompleted || transferCompleted
                  ? undefined
                  : { scale: 1.02 }
              }
              whileTap={
                !approvalCompleted || transferCompleted
                  ? undefined
                  : { scale: 0.98 }
              }
            >
              {transferLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Transferring...
                </>
              ) : transferCompleted ? (
                <>
                  <Check className="w-4 h-4" />
                  Transfer Complete
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  Transfer ${amount}
                </>
              )}
            </motion.button>
            {transferTxHash && (
              <a
                href={`https://etherscan.io/tx/${transferTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
              >
                <ExternalLink className="w-3 h-3" />
                View Transfer Transaction
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
