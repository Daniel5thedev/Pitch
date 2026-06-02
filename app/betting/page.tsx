"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { BettingConsole } from "@/components/BettingConsole";
import { User, Wallet, History, X, Save, ArrowLeft, RefreshCw, Trophy, Coins } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  full_name: string;
  phone_number: string;
}

interface WalletTx {
  id: string;
  amount_minor: number;
  type: "REFUND" | "PAYMENT" | "TOPUP";
  created_at: string;
}

export default function BettingArenaPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, startSaving] = useTransition();

  const supabase = getSupabaseBrowserClient();

  // Load/create anonymous session
  useEffect(() => {
    async function initAuth() {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        setSession(currentSession);
      } else {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          toast.error("Could not set up temporary session. Using mock session.");
        } else if (data.session) {
          setSession(data.session);
        }
      }
    }
    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Load wallet and profile once session is established
  useEffect(() => {
    if (!session?.user) return;

    const userId = session.user.id;

    async function loadUserData() {
      // 1. Profile
      const { data: profData } = await supabase
        .from("profiles")
        .select("id, full_name, phone_number")
        .eq("id", userId)
        .maybeSingle();

      if (profData) {
        setProfile(profData);
        setFullName(profData.full_name || "");
        setPhoneNumber(profData.phone_number || "");
      } else {
        const defaultName = `Captain ${userId.slice(0, 4).toUpperCase()}`;
        setFullName(defaultName);
        setProfile({ id: userId, full_name: defaultName, phone_number: "" });
      }

      // 2. Wallet
      const { data: walletData } = await supabase
        .from("wallets")
        .select("balance_minor")
        .eq("user_id", userId)
        .maybeSingle();
      if (walletData) {
        setWalletBalance(walletData.balance_minor);
      }

      // 3. Transactions
      const { data: txData } = await supabase
        .from("wallet_transactions")
        .select("id, amount_minor, type, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (txData) {
        setTransactions(txData as WalletTx[]);
      }
    }

    void loadUserData();

    // Subscribe to realtime database changes for profile and wallet
    const walletChannel = supabase
      .channel(`arena-wallet:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${userId}` },
        (payload: any) => {
          if (payload.new) {
            setWalletBalance(payload.new.balance_minor);
          }
        }
      )
      .subscribe();

    const txChannel = supabase
      .channel(`arena-txs:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${userId}` },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setTransactions(curr => [payload.new as WalletTx, ...curr]);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(walletChannel);
      void supabase.removeChannel(txChannel);
    };
  }, [session, supabase]);

  const saveProfile = () => {
    if (!session?.user) return;
    
    startSaving(async () => {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: session.user.id,
          full_name: fullName,
          phone_number: phoneNumber
        });

      if (error) {
        toast.error("Failed to save profile.");
      } else {
        setProfile({ id: session.user.id, full_name: fullName, phone_number: phoneNumber });
        if (phoneNumber) {
          window.localStorage.setItem("kahawa-prefill-phone", phoneNumber);
        }
        toast.success("Profile saved!");
      }
    });
  };

  const formatCurrency = (minor: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(minor / 100);
  };

  return (
    <main className="min-h-screen bg-transparent py-6 sm:py-10 text-[#F5F3FF] relative overflow-x-hidden">
      {/* Visual background details */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,135,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,135,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      
      <div className="mx-auto max-w-6xl px-4 animate-fade-in relative z-10">
        
        {/* Navigation & Header */}
        <nav className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between glass-panel p-5 rounded-2xl border border-cyan-blue/15">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FF87] to-[#60EFFF] p-0.5 shadow-[0_0_15px_rgba(0,255,135,0.3)] transition hover:scale-105 active:scale-95">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0A0F2C]">
                <span className="font-heading text-lg font-bold text-[#00FF87]">K</span>
              </div>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading text-lg font-bold tracking-wider uppercase text-white-soft">Kahawa Sport Arena</p>
                <span className="text-[9px] bg-red-600/20 border border-red-500/40 text-red-400 px-2 py-0.5 rounded-full font-heading font-bold uppercase tracking-wider animate-pulse">Betting Arena</span>
              </div>
              <p className="text-xs text-gray-muted tracking-widest font-heading uppercase">Live Virtual Odds Terminal</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {/* Back to Home Link */}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-panel/40 border border-cyan-blue/10 text-xs font-bold font-heading uppercase tracking-wider text-gray-muted hover:text-white-soft hover:bg-navy-panel transition active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>

            {/* Wallet Widget */}
            <div className="flex items-center gap-2 rounded-xl bg-[#1a1f3a]/60 px-4 py-2 border border-green-electric/25">
              <Wallet className="h-4 w-4 text-[#00FF87] text-glow-green" />
              <div className="text-left">
                <span className="block text-[9px] uppercase tracking-wider text-gray-muted">Wallet Credit</span>
                <span className="font-heading text-sm font-bold text-[#00FF87] tabular-nums">
                  {formatCurrency(walletBalance)}
                </span>
              </div>
            </div>

            {/* Profile trigger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#1a1f3a]/80 hover:bg-[#1a1f3a] px-4 py-2 text-sm font-medium text-white-soft transition border border-cyan-blue/15 hover:border-cyan-blue/30 active:scale-95"
            >
              <User className="h-4 w-4 text-[#60EFFF] text-glow-cyan" />
              <span className="hidden sm:inline font-heading tracking-wide uppercase">
                {profile?.full_name ? profile.full_name.split(" ")[0] : "Captain"}
              </span>
            </button>
          </div>
        </nav>

        {/* Betting Banner */}
        <header className="mb-8 rounded-2xl glass-panel-glow p-8 border border-green-electric/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] h-48 w-48 rounded-full bg-[#00FF87] opacity-[0.03] blur-[50px] pointer-events-none" />
          
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF87]/15 border border-[#00FF87]/30 mb-3">
              <Coins className="h-3.5 w-3.5 text-[#00FF87] text-glow-green" />
              <span className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#00FF87] text-glow-green">
                Accredited Virtual Betting
              </span>
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-white-soft uppercase">
              Arena Bets Terminal
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-muted">
              Analyze statistical odds, watch dynamic 3D virtual play-by-play trackers, and place stakes in real-time. Settlements are processed instantly back to your profile wallet.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/book"
              className="px-5 py-3 rounded-xl bg-[#121e15]/80 hover:bg-[#121e15] border border-[#00FF87]/20 hover:border-[#00FF87]/40 text-xs font-bold font-heading uppercase tracking-wider text-[#00FF87] text-glow-green transition active:scale-95"
            >
              Book Physical Pitch
            </Link>
          </div>
        </header>

        {/* Live Betting Console */}
        <div className="bg-[#0A0F2C]/40 p-1.5 rounded-2xl border border-cyan-blue/5">
          <BettingConsole
            currentUserId={session?.user?.id}
            walletBalance={walletBalance}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Drawer Settings */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="h-full w-full max-w-md bg-[#1a1f3a] p-6 shadow-2xl flex flex-col justify-between border-l border-cyan-blue/15 animate-slide-in-right overflow-y-auto">
              
              <div>
                <div className="flex items-center justify-between border-b border-gray-muted/10 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-[#60EFFF]" />
                    <h2 className="font-heading text-xl uppercase tracking-wider text-white-soft">Captain Dashboard</h2>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-lg text-gray-muted hover:text-white-soft hover:bg-navy-deep transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Profile Edit Panel */}
                <div className="glass-panel p-4 rounded-xl border border-cyan-blue/10 mb-6">
                  <h3 className="font-heading text-sm uppercase tracking-wider text-[#60EFFF] mb-3">Captain Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase text-gray-muted tracking-wider mb-1">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Captain Daniel"
                        className="w-full bg-[#0A0F2C]/80 border border-cyan-blue/20 rounded-lg px-3 py-2 text-sm text-white-soft outline-none focus:border-green-electric/50 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-gray-muted tracking-wider mb-1">M-Pesa Number</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 0712345678"
                        className="w-full bg-[#0A0F2C]/80 border border-cyan-blue/20 rounded-lg px-3 py-2 text-sm text-white-soft outline-none focus:border-green-electric/50 transition"
                      />
                    </div>
                    <button
                      onClick={saveProfile}
                      disabled={isSaving}
                      className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-[#00FF87] hover:bg-[#00FF87]/90 text-navy-deep font-bold text-xs uppercase transition tracking-wider disabled:opacity-50"
                    >
                      {isSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save Profile
                    </button>
                  </div>
                </div>

                {/* Wallet Transactions Panel */}
                <div className="glass-panel p-4 rounded-xl border border-green-electric/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading text-sm uppercase tracking-wider text-[#00FF87]">Wallet & Ledger</h3>
                    <span className="font-heading text-sm font-bold text-[#00FF87] tabular-nums">
                      {formatCurrency(walletBalance)}
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {transactions.length === 0 ? (
                      <p className="text-xs text-gray-muted italic text-center py-2">No transaction history yet.</p>
                    ) : (
                      transactions.map(tx => (
                        <div key={tx.id} className="flex justify-between items-center text-xs py-1.5 border-b border-gray-muted/5">
                          <div className="text-left">
                            <span className={`block font-semibold uppercase tracking-wider ${tx.type === "REFUND" ? "text-[#00FF87]" : "text-[#FF6B2C]"}`}>
                              {tx.type}
                            </span>
                            <span className="text-[10px] text-gray-muted">
                              {new Date(tx.created_at).toLocaleDateString(undefined, { dateStyle: "short" })}
                            </span>
                          </div>
                          <span className="font-heading font-bold tabular-nums">
                            {tx.type === "REFUND" ? "+" : "-"}{formatCurrency(tx.amount_minor)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-muted/10 pt-4 mt-6 text-center text-[10px] text-gray-muted">
                Session ID: {session?.user?.id?.slice(0, 16)}...
              </div>

            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-cyan-blue/15 pt-6 mt-16 text-center text-xs text-gray-muted font-heading uppercase tracking-widest flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>© 2026 Kahawa Sport Arena · Live Betting & Arena Console</span>
        </footer>

      </div>
    </main>
  );
}
