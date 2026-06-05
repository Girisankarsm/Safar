"use client";

import { useEffect, useState } from "react";
import { Coins, Leaf, Gift, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { Wallet } from "@/lib/types";

const REWARDS = [
  { type: "auto_discount", tokens: 250, label: "₹30 off auto ride", desc: "Last-mile auto discount" },
  { type: "metro_bonus", tokens: 150, label: "Metro top-up bonus", desc: "Extra metro credit" },
  { type: "safety_priority", tokens: 150, label: "Night-safe routing", desc: "7-day priority access" },
];

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Array<{ type: string; amount: number; description: string; created_at: string }>>([]);
  const [redeemMsg, setRedeemMsg] = useState("");

  useEffect(() => {
    api.getWallet().then(setWallet).catch(() => {});
    api.getTransactions().then((r) => setTransactions(r.transactions)).catch(() => {});
  }, []);

  async function handleRedeem(type: string, tokens: number) {
    try {
      const result = await api.redeem(type, tokens);
      setRedeemMsg(`Successfully redeemed: ${result.reward}`);
      api.getWallet().then(setWallet);
      api.getTransactions().then((r) => setTransactions(r.transactions));
    } catch (e) {
      setRedeemMsg(e instanceof Error ? e.message : "Redeem failed");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Green Token Wallet"
        description="Earn carbon tokens for sustainable commutes. Redeem for real rewards."
      />

      <Card className="overflow-hidden p-0">
        <div className="gradient-primary px-6 py-8 text-white">
          <p className="text-label text-blue-200">Available Balance</p>
          <div className="mt-2 flex items-end gap-2">
            <Coins className="mb-1 h-8 w-8 opacity-80" />
            <span className="text-5xl font-bold tracking-tight">{wallet?.balance ?? 340}</span>
            <span className="mb-2 text-sm font-medium text-blue-200">tokens</span>
          </div>
          <div className="mt-4 flex gap-6 text-sm text-blue-100">
            <span className="flex items-center gap-1.5"><Leaf className="h-4 w-4" />{wallet?.lifetime_co2_kg ?? 12.4} kg CO₂ saved</span>
            <span>{wallet?.green_trips_count ?? 28} green trips</span>
          </div>
        </div>
      </Card>

      <Section title="Redeem Rewards" description="Use your tokens for commute benefits">
        <div className="space-y-3">
          {REWARDS.map((r) => (
            <Card key={r.type} className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-light">
                <Gift className="h-5 w-5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{r.label}</p>
                <p className="text-xs text-muted">{r.desc} · {r.tokens} tokens</p>
              </div>
              <Button size="sm" onClick={() => handleRedeem(r.type, r.tokens)}>Redeem</Button>
            </Card>
          ))}
        </div>
        {redeemMsg && (
          <p className="mt-3 rounded-xl border border-accent/20 bg-accent-light/50 px-4 py-2.5 text-sm font-medium text-green-800">{redeemMsg}</p>
        )}
      </Section>

      <Section title="Transaction History">
        <div className="space-y-2">
          {transactions.length === 0 && (
            <Card className="py-8 text-center text-sm text-muted">Complete a green trip to start earning tokens</Card>
          )}
          {transactions.map((tx, i) => (
            <Card key={i} className="flex items-center gap-4 py-3.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tx.amount > 0 ? "bg-accent-light" : "bg-red-50"}`}>
                {tx.amount > 0
                  ? <ArrowUpRight className="h-4 w-4 text-accent" />
                  : <ArrowDownRight className="h-4 w-4 text-danger" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{tx.description}</p>
                <p className="text-xs text-muted">{new Date(tx.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-sm font-bold ${tx.amount > 0 ? "text-accent" : "text-danger"}`}>
                {tx.amount > 0 ? "+" : ""}{tx.amount}
              </span>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
