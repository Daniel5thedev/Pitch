"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookingCalendar } from "@/components/BookingCalendar";
import type { HoldResult, Pitch, Reservation } from "@/types/booking";
import { User, Wallet, History, X, Save, CheckCircle, Clock, CalendarDays, RefreshCw, Trophy } from "lucide-react";
import { toast } from "sonner";
import { BettingConsole } from "@/components/BettingConsole";


interface BookingPageProps {
  initialPitches: Pitch[];
  initialReservations: Reservation[];
  day: string;
  amountMinor: number;
}

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

export function BookingPage({ initialPitches, initialReservations, day, amountMinor }: BookingPageProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeConsole, setActiveConsole] = useState<"booking" | "betting">("booking");

  
  // Profile edit fields
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, startSaving] = useTransition();

  const userId = "mock-user";

  useEffect(() => {
    const savedProfile = window.localStorage.getItem("kahawa-profile");
    const savedPhone = window.localStorage.getItem("kahawa-prefill-phone");
    const defaultProfile = {
      id: userId,
      full_name: "Captain Simba",
      phone_number: savedPhone || "0712345678"
    };

    const profileData = savedProfile ? JSON.parse(savedProfile) as UserProfile : defaultProfile;
    setProfile(profileData);
    setFullName(profileData.full_name);
    setPhoneNumber(profileData.phone_number);

    const savedWallet = window.localStorage.getItem("kahawa-wallet-balance");
    const savedTxData = window.localStorage.getItem("kahawa-wallet-transactions");
    const savedBookings = window.localStorage.getItem("kahawa-bookings");

    if (savedWallet) {
      setWalletBalance(Number(savedWallet));
    } else {
      setWalletBalance(180000);
    }

    if (savedTxData) {
      setTransactions(JSON.parse(savedTxData) as WalletTx[]);
    }

    if (savedBookings) {
      setBookings(JSON.parse(savedBookings) as Reservation[]);
    }
  }, [userId]);

  const saveProfile = () => {
    if (!profile) return;

    startSaving(() => {
      const nextProfile = {
        ...profile,
        full_name: fullName,
        phone_number: phoneNumber
      };
      setProfile(nextProfile);
      window.localStorage.setItem("kahawa-profile", JSON.stringify(nextProfile));
      window.localStorage.setItem("kahawa-prefill-phone", phoneNumber);
      toast.success("Profile updated successfully!");
    });
  };

  const updateWallet = (newBalance: number, tx?: WalletTx) => {
    setWalletBalance(newBalance);
    window.localStorage.setItem("kahawa-wallet-balance", String(newBalance));

    if (tx) {
      const nextTx = [tx, ...transactions].slice(0, 20);
      setTransactions(nextTx);
      window.localStorage.setItem("kahawa-wallet-transactions", JSON.stringify(nextTx));
    }
  };

  const updateBookings = (nextBookings: Reservation[]) => {
    setBookings(nextBookings);
    window.localStorage.setItem("kahawa-bookings", JSON.stringify(nextBookings));
  };

  const onHoldCreated = useCallback((hold: HoldResult) => {
    window.localStorage.setItem("kahawa-current-hold", JSON.stringify(hold));
    router.push("/checkout");
  }, [router]);

  const formatCurrency = (minor: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(minor / 100);
  };

  const nowTime = new Date().getTime();
  const upcomingBookings = bookings.filter(b => b.status === "CONFIRMED" && new Date(b.slot_end).getTime() > nowTime);
  const pastBookings = bookings.filter(b => b.status === "CONFIRMED" && new Date(b.slot_end).getTime() <= nowTime);
  const activeHolds = bookings.filter(b => b.status === "PENDING_HOLD" && new Date(b.hold_expires_at || "").getTime() > nowTime);

  return (
    <main className="min-h-screen bg-transparent py-6 sm:py-10 text-[#F5F3FF]">
      <div className="mx-auto max-w-6xl px-4 animate-fade-in">
        
        {/* Navigation & Header */}
        <nav className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between glass-panel p-5 rounded-2xl border border-cyan-blue/15">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FF87] to-[#60EFFF] p-0.5 shadow-[0_0_15px_rgba(0,255,135,0.3)]">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0A0F2C]">
                <span className="font-heading text-lg font-bold text-[#00FF87]">K</span>
              </div>
            </div>
            <div>
              <p className="font-heading text-lg font-bold tracking-wider uppercase text-white-soft">Kahawa Sport Arena</p>
              <p className="text-xs text-gray-muted tracking-widest font-heading uppercase">Live Booking Hub</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {/* Wallet Widget */}
            <div className="flex items-center gap-2 rounded-xl bg-[#1a1f3a]/60 px-4 py-2 border border-green-electric/20">
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

        {/* Dashboard Console Tabs */}
        <div className="mb-8 flex border-b border-cyan-blue/10 pb-1 gap-6">
          <button
            onClick={() => setActiveConsole("booking")}
            className={`pb-3 px-1 text-sm font-bold font-heading uppercase tracking-widest relative transition-all duration-300 ${
              activeConsole === "booking"
                ? "text-[#00FF87] text-glow-green"
                : "text-gray-muted hover:text-white-soft"
            }`}
          >
            <CalendarDays className="inline h-4 w-4 mr-1.5" />
            Pitch Booking Console
            {activeConsole === "booking" && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-gradient-to-r from-[#00FF87] to-[#60EFFF] shadow-[0_0_8px_rgba(0,255,135,0.5)]" />
            )}
          </button>
          
          <button
            onClick={() => setActiveConsole("betting")}
            className={`pb-3 px-1 text-sm font-bold font-heading uppercase tracking-widest relative transition-all duration-300 ${
              activeConsole === "betting"
                ? "text-[#00FF87] text-glow-green"
                : "text-gray-muted hover:text-white-soft"
            }`}
          >
            <Trophy className="inline h-4 w-4 mr-1.5" />
            Arena Betting Console
            {activeConsole === "betting" && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-gradient-to-r from-[#00FF87] to-[#60EFFF] shadow-[0_0_8px_rgba(0,255,135,0.5)]" />
            )}
          </button>
        </div>

        {activeConsole === "booking" ? (
          <>
            {/* Dashboard Banner */}
            <header className="mb-8 rounded-2xl glass-panel-glow p-8 border border-green-electric/15 animate-fade-in">
              <p className="font-heading text-xs uppercase tracking-[0.3em] text-[#60EFFF] text-glow-cyan">Real-Time Pitch Booking</p>
              <h1 className="mt-2 font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-white-soft uppercase">
                Book Your Pitch
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-muted">
                Select your preferred time slot below. Holds are guaranteed for exactly <span className="text-[#FF6B2C] font-semibold">5 minutes</span> while you complete mobile money checkout.
              </p>
            </header>

            {/* Booking Calendar Grid */}
            <BookingCalendar
              initialPitches={initialPitches}
              initialReservations={initialReservations}
              day={day}
              amountMinor={amountMinor}
              onHoldCreated={onHoldCreated}
              currentUserId={profile?.id ?? "mock-user"}
            />
          </>
        ) : (
          <div className="animate-fade-in">
            {/* Betting Banner */}
            <header className="mb-8 rounded-2xl glass-panel-glow p-8 border border-green-electric/15">
              <p className="font-heading text-xs uppercase tracking-[0.3em] text-[#60EFFF] text-glow-cyan">Virtual Sport Betting Terminal</p>
              <h1 className="mt-2 font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-white-soft uppercase">
                Arena Bets Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-muted">
                Place stakes on virtual live matches running concurrently in our stadium. Slip settlements are deducted and credited to your wallet in real-time.
              </p>
            </header>

            <BettingConsole
              currentUserId={profile?.id ?? "mock-user"}
              walletBalance={walletBalance}
              formatCurrency={formatCurrency}
              onWalletUpdate={updateWallet}
            />
          </div>
        )}


        {/* Captain Profile and History Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="h-full w-full max-w-md bg-[#1a1f3a] p-6 shadow-2xl flex flex-col justify-between border-l border-cyan-blue/15 animate-slide-in-right overflow-y-auto">
              
              {/* Drawer Header */}
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
                <div className="glass-panel p-4 rounded-xl border border-green-electric/10 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading text-sm uppercase tracking-wider text-[#00FF87]">Wallet & Ledger</h3>
                    <span className="font-heading text-sm font-bold text-[#00FF87] tabular-nums">
                      {formatCurrency(walletBalance)}
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
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

                {/* Booking History */}
                <div>
                  <h3 className="font-heading text-sm uppercase tracking-wider text-white-soft mb-3 flex items-center gap-1.5">
                    <History className="h-4 w-4 text-[#60EFFF]" />
                    Booking History
                  </h3>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {/* Active Holds */}
                    {activeHolds.length > 0 && (
                      <div className="space-y-2">
                        <span className="block text-[10px] uppercase font-bold text-[#FF6B2C] tracking-widest">Active Holds</span>
                        {activeHolds.map(h => (
                          <div key={h.id} className="bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 rounded-xl p-3 flex justify-between items-center">
                            <div>
                              <strong className="block text-xs text-white-soft uppercase">Hold Reference: {h.booking_reference}</strong>
                              <span className="text-[10px] text-gray-muted block mt-0.5">
                                {new Date(h.slot_start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} - {new Date(h.slot_end).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setIsDrawerOpen(false);
                                onHoldCreated({
                                  reservation_id: h.id,
                                  pitch_id: h.pitch_id,
                                  slot_start: h.slot_start,
                                  slot_end: h.slot_end,
                                  status: "PENDING_HOLD",
                                  hold_expires_at: h.hold_expires_at || "",
                                  booking_reference: h.booking_reference || "",
                                  amount_minor: h.amount_minor || 0
                                });
                              }}
                              className="px-2.5 py-1 rounded bg-[#FF6B2C] text-white-soft text-[10px] uppercase font-bold tracking-wider hover:bg-[#FF6B2C]/90"
                            >
                              Checkout
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upcoming Bookings */}
                    <div className="space-y-2">
                      <span className="block text-[10px] uppercase font-bold text-[#00FF87] tracking-widest">Upcoming Matches</span>
                      {upcomingBookings.length === 0 ? (
                        <p className="text-xs text-gray-muted italic py-1">No upcoming matches.</p>
                      ) : (
                        upcomingBookings.map(b => (
                          <div key={b.id} className="bg-[#0A0F2C]/50 border border-green-electric/15 rounded-xl p-3 flex justify-between items-center">
                            <div>
                              <strong className="block text-xs text-white-soft uppercase">Ref: {b.booking_reference}</strong>
                              <span className="text-[10px] text-gray-muted block mt-0.5">
                                {new Date(b.slot_start).toLocaleDateString(undefined, { dateStyle: "medium" })}
                              </span>
                              <span className="text-[10px] text-[#00FF87] block mt-0.5">
                                {new Date(b.slot_start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} - {new Date(b.slot_end).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                              </span>
                            </div>
                            <CheckCircle className="h-5 w-5 text-[#00FF87] text-glow-green" />
                          </div>
                        ))
                      )}
                    </div>

                    {/* Past Bookings */}
                    <div className="space-y-2">
                      <span className="block text-[10px] uppercase font-bold text-gray-muted tracking-widest">Past Bookings</span>
                      {pastBookings.length === 0 ? (
                        <p className="text-xs text-gray-muted italic py-1">No past bookings.</p>
                      ) : (
                        pastBookings.map(b => (
                          <div key={b.id} className="bg-[#0A0F2C]/30 border border-gray-muted/10 rounded-xl p-3 flex justify-between items-center opacity-60">
                            <div>
                              <strong className="block text-xs text-white-soft uppercase">Ref: {b.booking_reference}</strong>
                              <span className="text-[10px] text-gray-muted block mt-0.5">
                                {new Date(b.slot_start).toLocaleDateString(undefined, { dateStyle: "medium" })}
                              </span>
                            </div>
                            <Clock className="h-5 w-5 text-gray-muted" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Session / Account Details */}
              <div className="border-t border-gray-muted/10 pt-4 mt-6 text-center text-[10px] text-gray-muted">
                Session ID: {profile?.id?.slice(0, 16) ?? "mock-user"}...
              </div>

            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-cyan-blue/15 pt-6 mt-16 text-center text-xs text-gray-muted font-heading uppercase tracking-widest flex flex-col sm:flex-row items-center justify-center gap-2 relative z-10">
          <span>© 2026 Kahawa Sport Arena · Live Booking & Betting Console</span>
          <span className="hidden sm:inline">·</span>
          <button
            onClick={() => {
              sessionStorage.removeItem("kahawa-splash-played");
              window.location.reload();
            }}
            className="hover:text-[#00FF87] text-[#60EFFF] transition underline cursor-pointer active:scale-95"
          >
            Replay Intro
          </button>
        </footer>

      </div>
    </main>
  );
}

