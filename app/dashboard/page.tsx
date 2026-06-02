"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  User, 
  Wallet, 
  History, 
  CheckCircle, 
  Clock, 
  Trash2, 
  FileText, 
  Bell, 
  Sliders, 
  Save, 
  Plus, 
  QrCode,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  CalendarDays
} from "lucide-react";
import { MockDatabase, MockBooking, MockWalletTx, MockNotification } from "@/lib/mockData";
import { toast } from "sonner";

export default function UserDashboard() {
  const [profileName, setProfileName] = useState("Captain Daniel");
  const [profilePhone, setProfilePhone] = useState("0712345678");
  const [profileSport, setProfileSport] = useState("Football");
  const [profilePosition, setProfilePosition] = useState("Playmaker (Midfield)");
  const [profileLevel, setProfileLevel] = useState("Semi-Pro");

  // State loaded from DB
  const [bookings, setBookings] = useState<MockBooking[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<MockWalletTx[]>([]);
  const [notifications, setNotifications] = useState<MockNotification[]>([]);
  
  // Forms
  const [topupAmount, setTopupAmount] = useState("");
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"bookings" | "wallet" | "settings">("bookings");

  useEffect(() => {
    // Load state
    setBookings(MockDatabase.getBookings());
    setWalletBalance(MockDatabase.getWalletBalance());
    setTransactions(MockDatabase.getWalletTransactions());
    setNotifications(MockDatabase.getNotifications());

    // Load settings from localStorage
    const savedName = localStorage.getItem("ds_profile_name");
    const savedPhone = localStorage.getItem("ds_profile_phone");
    const savedSport = localStorage.getItem("ds_profile_sport");
    const savedPos = localStorage.getItem("ds_profile_pos");
    const savedLevel = localStorage.getItem("ds_profile_level");

    if (savedName) setProfileName(savedName);
    if (savedPhone) setProfilePhone(savedPhone);
    if (savedSport) setProfileSport(savedSport);
    if (savedPos) setProfilePosition(savedPos);
    if (savedLevel) setProfileLevel(savedLevel);

    // Poll updates
    const poll = setInterval(() => {
      setBookings(MockDatabase.getBookings());
      setWalletBalance(MockDatabase.getWalletBalance());
      setTransactions(MockDatabase.getWalletTransactions());
      setNotifications(MockDatabase.getNotifications());
    }, 1500);

    return () => clearInterval(poll);
  }, []);

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("ds_profile_name", profileName);
    localStorage.setItem("ds_profile_phone", profilePhone);
    localStorage.setItem("ds_profile_sport", profileSport);
    localStorage.setItem("ds_profile_pos", profilePosition);
    localStorage.setItem("ds_profile_level", profileLevel);

    MockDatabase.addNotification(
      "Profile Settings Updated",
      "Successfully adjusted profile credentials and preferences.",
      "system"
    );
    toast.success("Profile details updated successfully!");
  };

  const handleMpesaTopup = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(topupAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setIsTopupLoading(true);
    toast.info(`Sending M-Pesa push STK prompt to ${profilePhone}...`);

    setTimeout(() => {
      MockDatabase.addWalletTx(amt, "TOPUP", `M-Pesa Web Topup (Ref: KSA-${Math.floor(100000 + Math.random() * 900000)})`);
      setWalletBalance(MockDatabase.getWalletBalance());
      setTransactions(MockDatabase.getWalletTransactions());
      setTopupAmount("");
      setIsTopupLoading(false);
      toast.success(`Deposit of KES ${amt} completed successfully!`);
    }, 2000);
  };

  const handleCancelBooking = (bookingId: string) => {
    if (confirm("Are you sure you want to cancel this booking reservation? A full refund will be credited back to your Captain Wallet.")) {
      MockDatabase.cancelBooking(bookingId);
      setBookings(MockDatabase.getBookings());
      setWalletBalance(MockDatabase.getWalletBalance());
      setTransactions(MockDatabase.getWalletTransactions());
      toast.success("Booking cancelled and full KES refund credited!");
    }
  };

  const markAllNotificationsRead = () => {
    MockDatabase.markNotificationsRead();
    setNotifications(MockDatabase.getNotifications());
    toast.success("All notifications marked as read!");
  };

  const handleDownloadReceipt = (booking: MockBooking) => {
    // Generate simulated HTML/TXT receipt download
    const receiptContent = `
=============================================
             KAHAWA SPORT ARENA
          OFFICIAL BOOKING INVOICE
=============================================
Invoice Reference: ${booking.bookingRef}
Date Issued: ${new Date(booking.createdAt).toLocaleDateString()}
Status: PAID (Simulated Wallet Payment)

BILL TO:
Captain Name: ${profileName}
Phone Number: ${profilePhone}
Experience Rank: ${profileLevel}

ITEM DESCRIPTION:
Reservation target: ${booking.targetName}
Type: ${booking.type === "venue" ? "Court Spec Field" : "1-on-1 Certified Coach Session"}
Scheduled Date: ${booking.slotDate}
Scheduled Slot: ${booking.slotTime}

FINANCIAL DATA:
Subtotal: KES ${booking.price}.00
Tax / Processing: KES 0.00
Cashback Earned: KES ${Math.floor(booking.price * 0.05)}.00
---------------------------------------------
TOTAL SETTLED: KES ${booking.price}.00
=============================================
      THANK YOU FOR PLAYING AT THE ARENA!
    © 2026 Kahawa Sport Arena. Ngong Rd Adams.
=============================================
    `;

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Receipt_${booking.bookingRef}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Receipt downloaded successfully!");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const activeBookings = bookings.filter(b => b.status === "CONFIRMED");
  const unreadNotifs = notifications.filter(n => !n.read);

  return (
    <div className="p-4 sm:p-8 bg-transparent min-h-screen text-[#F5F3FF] relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,135,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,135,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10 animate-fade-in text-left">
        
        {/* Banner header */}
        <header className="rounded-2xl glass-panel-glow p-6 sm:p-8 border border-[#00FF87]/15 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg">
          <div className="absolute top-[-20%] right-[-10%] h-48 w-48 rounded-full bg-[#00FF87] opacity-[0.03] blur-[60px] pointer-events-none" />
          
          <div>
            <span className="font-heading text-xs uppercase tracking-[0.25em] text-[#60EFFF] text-glow-cyan">Captain Workspace</span>
            <h1 className="mt-2 font-heading text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
              MY DASHBOARD
            </h1>
            <p className="mt-3 max-w-2xl text-xs sm:text-sm text-gray-muted leading-relaxed">
              Track your upcoming matches, cancel reservations with instant refunds, verify payment ledgers, and manage your team profile.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 self-stretch md:self-auto select-none">
            <div className="bg-[#121e15]/40 border border-[#00FF87]/15 rounded-xl px-4 py-2.5 flex-1 md:flex-initial text-left">
              <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Matches</span>
              <span className="font-heading text-base font-black text-[#00FF87] tracking-tight mt-1 block">
                {activeBookings.length}
              </span>
            </div>
            <div className="bg-[#121e15]/40 border border-[#60EFFF]/15 rounded-xl px-4 py-2.5 flex-1 md:flex-initial text-left">
              <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Wallet Balance</span>
              <span className="font-heading text-base font-black text-[#60EFFF] tracking-tight mt-1 block tabular-nums">
                {formatCurrency(walletBalance)}
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Tabs menu */}
        <div className="flex border-b border-white/5 pb-1 gap-6 select-none">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`pb-3 px-1 text-xs font-bold font-heading uppercase tracking-widest relative transition-all duration-300 ${
              activeTab === "bookings"
                ? "text-[#00FF87] text-glow-green"
                : "text-gray-muted hover:text-white"
            }`}
          >
            <CalendarDays className="inline h-4 w-4 mr-1.5" />
            Bookings & Entry Passes
            {activeTab === "bookings" && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-gradient-to-r from-[#00FF87] to-[#60EFFF] shadow-[0_0_8px_rgba(0,255,135,0.5)]" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("wallet")}
            className={`pb-3 px-1 text-xs font-bold font-heading uppercase tracking-widest relative transition-all duration-300 ${
              activeTab === "wallet"
                ? "text-[#00FF87] text-glow-green"
                : "text-gray-muted hover:text-white"
            }`}
          >
            <Wallet className="inline h-4 w-4 mr-1.5" />
            Wallet & Topups
            {activeTab === "wallet" && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-gradient-to-r from-[#00FF87] to-[#60EFFF] shadow-[0_0_8px_rgba(0,255,135,0.5)]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-1 text-xs font-bold font-heading uppercase tracking-widest relative transition-all duration-300 ${
              activeTab === "settings"
                ? "text-[#00FF87] text-glow-green"
                : "text-gray-muted hover:text-white"
            }`}
          >
            <Sliders className="inline h-4 w-4 mr-1.5" />
            Captain Profile
            {activeTab === "settings" && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-gradient-to-r from-[#00FF87] to-[#60EFFF] shadow-[0_0_8px_rgba(0,255,135,0.5)]" />
            )}
          </button>
        </div>

        {/* Tab content view */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* Main Tab Area (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* BOOKINGS TAB */}
            {activeTab === "bookings" && (
              <div className="space-y-6">
                <h3 className="font-heading text-lg uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-[#00FF87]" /> Active Booking Entry Passes
                </h3>

                {activeBookings.length === 0 ? (
                  <div className="glass-panel p-10 rounded-2xl border-white/5 text-center space-y-4">
                    <CalendarDays className="h-10 w-10 text-gray-muted mx-auto animate-pulse" />
                    <h4 className="font-heading text-lg uppercase text-white font-bold">No active match passes</h4>
                    <p className="text-xs text-gray-muted max-w-xs mx-auto">
                      Reserve a premium court slot or class session to generate your glowing digital QR entry passes.
                    </p>
                    <Link
                      href="/venues"
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-[#00FF87] text-[#040a06] px-4 font-heading text-xs font-extrabold uppercase tracking-widest"
                    >
                      Book Court Now
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {activeBookings.map((b) => (
                      <div 
                        key={b.id}
                        className="glass-panel rounded-2xl border-[#00FF87]/15 overflow-hidden flex flex-col justify-between group shadow-md"
                      >
                        {/* Header details */}
                        <div className="p-4 border-b border-white/5 flex gap-4 text-left">
                          {/* Simulated Digital QR Entry Pass */}
                          <div className="h-16 w-16 bg-white rounded-lg flex items-center justify-center p-1.5 shrink-0 shadow-inner group-hover:scale-105 transition duration-300">
                            <QrCode className="h-full w-full text-black stroke-[1.5]" />
                          </div>

                          <div className="space-y-1 overflow-hidden">
                            <span className="block text-[8px] uppercase tracking-widest text-[#00FF87] font-semibold leading-none">
                              {b.type === "venue" ? "Court Pass" : "Coach Pass"}
                            </span>
                            <h4 className="font-heading text-sm uppercase text-white font-bold leading-tight truncate">
                              {b.targetName}
                            </h4>
                            <span className="block text-[9px] text-gray-muted font-mono leading-none truncate mt-1 block">
                              Ref: {b.bookingRef}
                            </span>
                          </div>
                        </div>

                        {/* Match Times and Stats details */}
                        <div className="p-4 text-left space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-muted">Kickoff Date:</span>
                            <span className="text-white font-semibold font-heading uppercase">{b.slotDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-muted">Time Block:</span>
                            <span className="text-[#00FF87] font-bold font-heading">{b.slotTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-muted">Gateway Rate:</span>
                            <span className="text-white font-mono">{formatCurrency(b.price)}</span>
                          </div>
                        </div>

                        {/* Footer action logs */}
                        <div className="px-4 pb-4 pt-2 border-t border-white/5 flex gap-2">
                          <button
                            onClick={() => handleDownloadReceipt(b)}
                            className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-heading font-extrabold uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1"
                          >
                            <FileText className="h-3 w-3" /> Invoice
                          </button>
                          
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="flex-1 py-2 rounded-xl bg-red-600/10 border border-red-500/20 hover:bg-red-600 hover:text-white text-red-400 text-[10px] font-heading font-extrabold uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" /> Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* WALLET TAB */}
            {activeTab === "wallet" && (
              <div className="space-y-6">
                <h3 className="font-heading text-lg uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Wallet className="h-4.5 w-4.5 text-[#00FF87]" /> Captain Wallet Operations
                </h3>

                <div className="grid gap-6 sm:grid-cols-2">
                  
                  {/* Topup Form Card */}
                  <div className="glass-panel p-5 rounded-2xl border-[#00FF87]/20 text-left space-y-4">
                    <h4 className="font-heading text-sm uppercase tracking-wider text-white font-bold">Load Credit via M-Pesa</h4>
                    <p className="text-[10px] text-gray-muted leading-relaxed">
                      Enter deposit value. Tapping top-up simulates a secure Safaricom push confirmation pop-up linked to your phone.
                    </p>
                    
                    <form onSubmit={handleMpesaTopup} className="space-y-4">
                      <div>
                        <label className="block text-[8px] uppercase text-gray-muted tracking-widest font-heading font-bold mb-1">M-Pesa Mobile Number</label>
                        <input
                          type="tel"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="e.g. 0712345678"
                          required
                          className="w-full bg-[#040a06]/85 border border-[#00FF87]/20 focus:border-[#00FF87]/50 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] uppercase text-gray-muted tracking-widest font-heading font-bold mb-1">Topup Amount (KES)</label>
                        <input
                          type="number"
                          value={topupAmount}
                          onChange={(e) => setTopupAmount(e.target.value)}
                          placeholder="e.g. 2500"
                          required
                          disabled={isTopupLoading}
                          className="w-full bg-[#040a06]/85 border border-[#00FF87]/20 focus:border-[#00FF87]/50 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isTopupLoading}
                        className="w-full py-3 px-4 rounded-xl bg-[#00FF87] hover:bg-[#00FF87]/90 text-[#040a06] font-heading font-black text-xs uppercase tracking-widest transition duration-300 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,255,135,0.2)]"
                      >
                        <Plus className="h-4 w-4" />
                        {isTopupLoading ? "Processing Push..." : "Simulate Topup"}
                      </button>
                    </form>
                  </div>

                  {/* Financial Stats Card */}
                  <div className="glass-panel p-5 rounded-2xl border-cyan-blue/15 text-left flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="font-heading text-sm uppercase tracking-wider text-white font-bold">Ledger Overview</h4>
                      <p className="text-[10px] text-gray-muted leading-relaxed">
                        Earn 5% booking cashback status! Use your Captain balance credit on matches, coach sessions, or settle stakes inside the Betting Arena.
                      </p>
                    </div>

                    <div className="bg-[#040a06]/50 border border-white/5 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-muted">Wallet Balance:</span>
                        <strong className="text-[#00FF87] font-black font-heading text-base tabular-nums">{formatCurrency(walletBalance)}</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2.5">
                        <span className="text-gray-muted">Cashback earned:</span>
                        <span className="text-[#60EFFF] font-bold font-heading tabular-nums">{formatCurrency(Math.floor(walletBalance * 0.05))}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* scrollable ledger transactions list */}
                <div className="glass-panel p-5 rounded-2xl border-white/5 text-left space-y-4">
                  <h4 className="font-heading text-sm uppercase tracking-wider text-white font-bold flex items-center gap-1">
                    <History className="h-4 w-4 text-[#60EFFF]" /> Wallet Transaction Ledger
                  </h4>
                  <div className="overflow-x-auto max-h-[220px]">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[9px] uppercase tracking-wider text-gray-muted border-b border-white/5">
                        <tr>
                          <th className="py-2.5">Type</th>
                          <th className="py-2.5">Description</th>
                          <th className="py-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {transactions.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-4 text-center italic text-gray-muted">No transactions yet.</td>
                          </tr>
                        ) : (
                          transactions.map(tx => (
                            <tr key={tx.id} className="text-xs">
                              <td className={`py-3 font-semibold uppercase ${tx.type === "TOPUP" || tx.type === "REFUND" ? "text-[#00FF87]" : "text-[#FF6B2C]"}`}>
                                {tx.type}
                              </td>
                              <td className="py-3 text-gray-muted">{tx.description}</td>
                              <td className={`py-3 text-right font-bold font-heading tabular-nums ${tx.type === "TOPUP" || tx.type === "REFUND" ? "text-[#00FF87]" : "text-white"}`}>
                                {tx.type === "TOPUP" || tx.type === "REFUND" ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* PROFILE SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="glass-panel p-6 rounded-2xl border-cyan-blue/15 text-left space-y-6">
                <h3 className="font-heading text-lg uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Sliders className="h-4.5 w-4.5 text-[#60EFFF]" /> Customize Captain Credentials
                </h3>

                <form onSubmit={saveSettings} className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-gray-muted font-heading font-extrabold mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      className="w-full bg-[#040a06]/85 border border-[#00FF87]/20 focus:border-[#00FF87]/50 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-gray-muted font-heading font-extrabold mb-1">M-Pesa Registered Number</label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      required
                      className="w-full bg-[#040a06]/85 border border-[#00FF87]/20 focus:border-[#00FF87]/50 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-gray-muted font-heading font-extrabold mb-1">Primary Sport Interest</label>
                    <select
                      value={profileSport}
                      onChange={(e) => setProfileSport(e.target.value)}
                      className="w-full bg-[#040a06]/85 border border-[#00FF87]/20 focus:border-[#00FF87]/50 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                    >
                      <option value="Football">Football</option>
                      <option value="Basketball">Basketball</option>
                      <option value="Tennis">Tennis</option>
                      <option value="Padel">Padel</option>
                      <option value="Volleyball">Volleyball</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-gray-muted font-heading font-extrabold mb-1">Squad Position / Role</label>
                    <input
                      type="text"
                      value={profilePosition}
                      onChange={(e) => setProfilePosition(e.target.value)}
                      placeholder="e.g. Center-Back, Goalpost"
                      className="w-full bg-[#040a06]/85 border border-[#00FF87]/20 focus:border-[#00FF87]/50 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-gray-muted font-heading font-extrabold mb-1">Experience Rank</label>
                    <select
                      value={profileLevel}
                      onChange={(e) => setProfileLevel(e.target.value)}
                      className="w-full bg-[#040a06]/85 border border-[#00FF87]/20 focus:border-[#00FF87]/50 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                    >
                      <option value="Casual">Casual Player</option>
                      <option value="Amateur">Amateur League</option>
                      <option value="Semi-Pro">Semi-Pro Athlete</option>
                      <option value="Professional">Pro Division Captain</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 pt-4">
                    <button
                      type="submit"
                      className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#00FF87] hover:bg-[#00FF87]/90 text-[#040a06] font-heading font-black text-xs uppercase tracking-widest transition duration-300 active:scale-95 flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,255,135,0.2)]"
                    >
                      <Save className="h-4.5 w-4.5" /> Save Profile Preferences
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

          {/* Right Column: Notifications and Alerts Tray (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6 text-left select-none">
            <div className="glass-panel p-5 rounded-2xl border-cyan-blue/15 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="font-heading text-sm uppercase tracking-wider text-white flex items-center gap-1.5 font-bold">
                  <Bell className="h-4.5 w-4.5 text-[#60EFFF]" /> Notifications Log
                </h3>
                {unreadNotifs.length > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[9px] text-[#00FF87] hover:text-[#60EFFF] font-heading font-bold uppercase tracking-wider"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-muted italic text-center py-4">No notification alerts log found.</p>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-3.5 rounded-xl border text-xs text-left space-y-1.5 transition-all ${
                        notif.read 
                          ? "bg-white/5 border-white/5 opacity-60" 
                          : "bg-[#121e15]/20 border-[#00FF87]/15 shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <strong className={`font-semibold uppercase tracking-wide ${notif.read ? "text-white" : "text-[#00FF87]"}`}>
                          {notif.title}
                        </strong>
                        <span className="text-[8px] text-gray-muted">
                          {new Date(notif.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-muted leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Favorite Venues shortcut */}
            <div className="glass-panel p-5 rounded-2xl border-white/5 text-left space-y-3 bg-[#0A0F2C]/40">
              <h4 className="font-heading text-xs uppercase tracking-widest text-[#00FF87]">Favorite Complexes</h4>
              <div className="space-y-2">
                <Link href="/venues/v1" className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-[#00FF87]/30 transition group">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MapPin className="h-3.5 w-3.5 text-[#60EFFF] shrink-0" />
                    <span className="text-xs text-white group-hover:text-[#00FF87] truncate font-heading font-semibold uppercase tracking-wider">Riverside Grand</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-muted group-hover:text-white transition-transform group-hover:translate-x-1" />
                </Link>

                <Link href="/venues/v3" className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-[#00FF87]/30 transition group">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MapPin className="h-3.5 w-3.5 text-[#60EFFF] shrink-0" />
                    <span className="text-xs text-white group-hover:text-[#00FF87] truncate font-heading font-semibold uppercase tracking-wider">Apex Padel Club</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-muted group-hover:text-white transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
