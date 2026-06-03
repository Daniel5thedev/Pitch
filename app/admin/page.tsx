"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Trophy, 
  DollarSign, 
  SlidersHorizontal,
  ChevronRight, 
  FileText, 
  Eye, 
  Settings, 
  Wrench,
  Search,
  CheckCircle,
  Save,
  Download
} from "lucide-react";
import { MockDatabase, MockVenue, MockBooking } from "@/lib/mockData";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const [venues, setVenues] = useState<MockVenue[]>([]);
  const [bookings, setBookings] = useState<MockBooking[]>([]);
  const [stats, setStats] = useState({
    revenue: 0,
    bookingsCount: 0,
    utilizationRate: 0,
    activeUsers: 0,
    activeCoaches: 0,
    venuesCount: 0
  });

  // Admin interactive states
  const [userSearch, setUserSearch] = useState("");
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [venuePriceInput, setVenuePriceInput] = useState<number>(0);
  const [selectedChartTab, setSelectedChartTab] = useState<"revenue" | "occupancy">("revenue");

  useEffect(() => {
    // Load admin metrics
    setVenues(MockDatabase.getVenues());
    setBookings(MockDatabase.getBookings());
    setStats(MockDatabase.getAdminAnalytics());

    // Poll updates
    const poll = setInterval(() => {
      setVenues(MockDatabase.getVenues());
      setBookings(MockDatabase.getBookings());
      setStats(MockDatabase.getAdminAnalytics());
    }, 1500);

    return () => clearInterval(poll);
  }, []);

  const handleToggleVenueStatus = (venueId: string) => {
    const v = MockDatabase.getVenueById(venueId);
    if (v) {
      const nextStatus = v.status === "Available" ? "Maintenance" : "Available";
      v.status = nextStatus;
      MockDatabase.updateVenue(v);
      setVenues(MockDatabase.getVenues());
      
      MockDatabase.addNotification(
        "Complex Status Override",
        `Admin toggled complex ${v.name} status to ${nextStatus}.`,
        "system"
      );
      toast.success(`${v.name} status updated to ${nextStatus}!`);
    }
  };

  const handleEditPrice = (venue: MockVenue) => {
    setEditingVenueId(venue.id);
    setVenuePriceInput(venue.pricePerHour);
  };

  const handleSavePrice = (venueId: string) => {
    const v = MockDatabase.getVenueById(venueId);
    if (v) {
      v.pricePerHour = venuePriceInput;
      MockDatabase.updateVenue(v);
      setVenues(MockDatabase.getVenues());
      setEditingVenueId(null);
      
      MockDatabase.addNotification(
        "Complex Rate Adjustment",
        `Admin adjusted complex ${v.name} rate to KES ${venuePriceInput}/hr.`,
        "system"
      );
      toast.success(`${v.name} rate adjusted to KES ${venuePriceInput}/hour!`);
    }
  };

  const handleDownloadAdminReport = () => {
    const reportContent = `
=============================================
             KAHAWA SPORT ARENA
          OPERATIONS MANAGEMENT REPORT
=============================================
Report Generated: ${new Date().toLocaleString()}
Operator Level: Root Administrator

1. MACRO PERFORMANCE METRICS:
Total Settled Revenue: KES ${stats.revenue}.00
Total Booking Counts: ${stats.bookingsCount}
Active Captains: ${stats.activeUsers}
Verified Coaches: ${stats.activeCoaches}
Stadium Occupancy Rate: ${stats.utilizationRate}%

2. COMPLEX HARDWARE OVERVIEW:
${venues.map(v => ` - [${v.id}] ${v.name} (${v.category}) | Rate: KES ${v.pricePerHour}/hr | Status: ${v.status}`).join("\n")}

3. RECENT DATABASE TRANSACTIONS SUMMARY:
Total Ledger Log Entries: ${bookings.length}
Confirmed Holds: ${bookings.filter(b => b.status === "CONFIRMED").length}
Pending Holds: ${bookings.filter(b => b.status === "PENDING_HOLD").length}
Cancelled Refunding: ${bookings.filter(b => b.status === "CANCELLED").length}

=============================================
  END OF DATABASE OPERATIONS STATE DUMP
=============================================
    `;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `KahawaSportArena_AdminReport_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Operational metrics report exported!");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Mock users directory
  const mockCaptains = [
    { name: "Captain Daniel W.", phone: "0712345678", level: "Semi-Pro", wallet: 14500, matches: 3 },
    { name: "Captain Cynthia M.", phone: "0788345229", level: "Amateur", wallet: 8500, matches: 2 },
    { name: "Captain Salim Kip", phone: "0722119934", level: "Professional", wallet: 2200, matches: 1 },
    { name: "Captain Charles O.", phone: "0701445588", level: "Casual", wallet: 0, matches: 0 }
  ];

  const filteredCaptains = mockCaptains.filter(c => 
    c.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    c.phone.includes(userSearch)
  );

  return (
    <div className="p-4 sm:p-8 bg-transparent min-h-screen text-[#F5F3FF] relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,135,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,135,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10 animate-fade-in text-left">
        
        {/* Banner Header */}
        <header className="rounded-2xl glass-panel-glow p-6 sm:p-8 border border-red-500/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg bg-gradient-to-r from-[#040a06]/85 to-[#060a1c]/85">
          <div className="absolute top-[-20%] right-[-10%] h-48 w-48 rounded-full bg-red-500 opacity-[0.03] blur-[60px] pointer-events-none" />
          
          <div>
            <span className="font-heading text-xs uppercase tracking-[0.25em] text-[#00FF87] text-glow-green">System Control Console</span>
            <h1 className="mt-2 font-heading text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none flex items-center gap-2">
              ADMIN CONTROL <ShieldCheck className="h-8 w-8 text-[#00FF87] shrink-0" />
            </h1>
            <p className="mt-3 max-w-2xl text-xs sm:text-sm text-gray-muted leading-relaxed">
              Adjust hourly complex rates, toggle turf active availability codes, inspect registered captains, and export administrative diagnostics.
            </p>
          </div>

          <button
            onClick={handleDownloadAdminReport}
            className="px-4 py-3 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-xs font-bold font-heading uppercase tracking-widest transition duration-300 active:scale-95 shadow-md flex items-center gap-1.5 shrink-0 self-stretch md:self-auto justify-center"
          >
            <Download className="h-4.5 w-4.5" />
            Export Diagnostics
          </button>
        </header>

        {/* Analytics Statistics Grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 select-none">
          {/* Card 1 */}
          <div className="glass-panel p-5 rounded-2xl border-cyan-blue/15 flex items-center gap-4 text-left shadow-md">
            <div className="h-11 w-11 rounded-xl bg-[#00FF87]/10 text-[#00FF87] flex items-center justify-center shrink-0 border border-[#00FF87]/15">
              <DollarSign className="h-5.5 w-5.5 text-glow-green" />
            </div>
            <div>
              <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Total Revenue</span>
              <span className="font-heading text-xl font-black text-[#00FF87] text-glow-green mt-1 block tabular-nums">
                {formatCurrency(stats.revenue)}
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-5 rounded-2xl border-cyan-blue/15 flex items-center gap-4 text-left shadow-md">
            <div className="h-11 w-11 rounded-xl bg-[#60EFFF]/10 text-[#60EFFF] flex items-center justify-center shrink-0 border border-[#60EFFF]/15">
              <TrendingUp className="h-5.5 w-5.5 text-glow-cyan" />
            </div>
            <div>
              <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Court Occupancy</span>
              <span className="font-heading text-xl font-black text-white mt-1 block">
                {stats.utilizationRate}%
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-5 rounded-2xl border-cyan-blue/15 flex items-center gap-4 text-left shadow-md">
            <div className="h-11 w-11 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/15">
              <Users className="h-5.5 w-5.5 text-[#FF6B2C]" />
            </div>
            <div>
              <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Active Players</span>
              <span className="font-heading text-xl font-black text-white mt-1 block">
                {stats.activeUsers} Captains
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-panel p-5 rounded-2xl border-cyan-blue/15 flex items-center gap-4 text-left shadow-md">
            <div className="h-11 w-11 rounded-xl bg-[#60EFFF]/10 text-[#60EFFF] flex items-center justify-center shrink-0 border border-white/5">
              <Trophy className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Verified Coaches</span>
              <span className="font-heading text-xl font-black text-white mt-1 block">
                {stats.activeCoaches} Trainers
              </span>
            </div>
          </div>
        </section>

        {/* Charts & Plots (Interactive Responsive SVG) */}
        <section className="glass-panel p-6 rounded-3xl border-cyan-blue/15 text-left space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 select-none border-b border-white/5 pb-4">
            <div>
              <h3 className="font-heading text-lg uppercase tracking-wider text-white">Complex Occupancy Plots</h3>
              <p className="text-[10px] text-gray-muted leading-relaxed mt-0.5">Statistical weekly occupancy rates and monthly earnings ledger charts.</p>
            </div>
            <div className="flex gap-1.5 bg-[#040a06]/70 border border-white/5 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setSelectedChartTab("revenue")}
                className={`py-1.5 px-3.5 text-[9px] font-heading font-bold uppercase tracking-wider rounded-lg transition-all ${
                  selectedChartTab === "revenue" ? "bg-[#00FF87] text-[#040a06]" : "text-gray-muted hover:text-white"
                }`}
              >
                Revenue Flow
              </button>
              <button
                onClick={() => setSelectedChartTab("occupancy")}
                className={`py-1.5 px-3.5 text-[9px] font-heading font-bold uppercase tracking-wider rounded-lg transition-all ${
                  selectedChartTab === "occupancy" ? "bg-[#00FF87] text-[#040a06]" : "text-gray-muted hover:text-white"
                }`}
              >
                Court Occupancy
              </button>
            </div>
          </div>

          {/* SVG Animated Chart */}
          <div className="w-full h-64 bg-[#040a06]/40 rounded-2xl p-4 flex items-center justify-center relative border border-white/5 overflow-hidden">
            {selectedChartTab === "revenue" ? (
              <svg viewBox="0 0 500 200" className="w-full h-full">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00FF87" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#00FF87" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal grid lines */}
                <line x1="40" y1="30" x2="480" y2="30" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
                <line x1="40" y1="80" x2="480" y2="80" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
                <line x1="40" y1="130" x2="480" y2="130" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
                <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.08)" />

                {/* SVG Area under Curve */}
                <path 
                  d="M 40 170 Q 110 130 150 140 T 260 80 T 370 100 T 480 40 L 480 170 Z" 
                  fill="url(#chartGrad)" 
                />

                {/* SVG Path Curve Line */}
                <path 
                  d="M 40 170 Q 110 130 150 140 T 260 80 T 370 100 T 480 40" 
                  fill="none" 
                  stroke="#00FF87" 
                  strokeWidth="3.5" 
                  className="stroke-glow-green"
                  strokeDasharray="600"
                  strokeDashoffset="0"
                />

                {/* Data Points */}
                <circle cx="150" cy="140" r="4.5" fill="#00FF87" stroke="#040a06" strokeWidth="1.5" />
                <circle cx="260" cy="80" r="4.5" fill="#60EFFF" stroke="#040a06" strokeWidth="1.5" />
                <circle cx="370" cy="100" r="4.5" fill="#00FF87" stroke="#040a06" strokeWidth="1.5" />
                <circle cx="480" cy="40" r="5" fill="#60EFFF" stroke="#040a06" strokeWidth="1.5" className="animate-pulse" />

                {/* Axis Labels */}
                <text x="40" y="185" textAnchor="middle" className="fill-gray-muted text-[8px] tracking-wider uppercase font-heading font-semibold">Jan</text>
                <text x="150" y="185" textAnchor="middle" className="fill-gray-muted text-[8px] tracking-wider uppercase font-heading font-semibold">Feb</text>
                <text x="260" y="185" textAnchor="middle" className="fill-gray-muted text-[8px] tracking-wider uppercase font-heading font-semibold">Mar</text>
                <text x="370" y="185" textAnchor="middle" className="fill-gray-muted text-[8px] tracking-wider uppercase font-heading font-semibold">Apr</text>
                <text x="480" y="185" textAnchor="middle" className="fill-[#00FF87] text-[8px] tracking-wider uppercase font-heading font-bold">May (Active)</text>

                {/* Y Axis Values */}
                <text x="32" y="34" textAnchor="end" className="fill-gray-muted text-[8px] font-mono">KES 100k</text>
                <text x="32" y="84" textAnchor="end" className="fill-gray-muted text-[8px] font-mono">KES 50k</text>
                <text x="32" y="134" textAnchor="end" className="fill-gray-muted text-[8px] font-mono">KES 10k</text>

                {/* Floating Interactive Tooltip */}
                <g transform="translate(300, 35)" className="select-none">
                  <rect width="90" height="30" rx="6" fill="#121e15" stroke="#00FF87" strokeWidth="0.8" opacity="0.9" />
                  <text x="45" y="12" textAnchor="middle" className="fill-gray-muted text-[7px] tracking-wider uppercase font-heading font-bold">May Income</text>
                  <text x="45" y="24" textAnchor="middle" className="fill-[#00FF87] font-black text-[9px] tracking-wide font-heading">KES 112,500</text>
                </g>
              </svg>
            ) : (
              <svg viewBox="0 0 500 200" className="w-full h-full">
                {/* Horizontal grid lines */}
                <line x1="40" y1="30" x2="480" y2="30" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
                <line x1="40" y1="80" x2="480" y2="80" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
                <line x1="40" y1="130" x2="480" y2="130" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
                <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.08)" />

                {/* Bar Chart Blocks */}
                {/* Mon */}
                <rect x="75" y="90" width="30" height="80" rx="4" fill="#60EFFF" opacity="0.85" className="hover:fill-[#00FF87] transition-all cursor-pointer" />
                {/* Tue */}
                <rect x="145" y="70" width="30" height="100" rx="4" fill="#60EFFF" opacity="0.85" className="hover:fill-[#00FF87] transition-all cursor-pointer" />
                {/* Wed */}
                <rect x="215" y="80" width="30" height="90" rx="4" fill="#60EFFF" opacity="0.85" className="hover:fill-[#00FF87] transition-all cursor-pointer" />
                {/* Thu */}
                <rect x="285" y="50" width="30" height="120" rx="4" fill="#60EFFF" opacity="0.85" className="hover:fill-[#00FF87] transition-all cursor-pointer" />
                {/* Fri */}
                <rect x="355" y="35" width="30" height="135" rx="4" fill="#00FF87" className="hover:fill-[#60EFFF] transition-all cursor-pointer shadow-md" />
                {/* Sat */}
                <rect x="425" y="25" width="30" height="145" rx="4" fill="#00FF87" className="hover:fill-[#60EFFF] transition-all cursor-pointer shadow-md" />

                {/* Labels */}
                <text x="90" y="185" textAnchor="middle" className="fill-gray-muted text-[8px] tracking-wider uppercase font-heading font-semibold">Mon</text>
                <text x="160" y="185" textAnchor="middle" className="fill-gray-muted text-[8px] tracking-wider uppercase font-heading font-semibold">Tue</text>
                <text x="230" y="185" textAnchor="middle" className="fill-gray-muted text-[8px] tracking-wider uppercase font-heading font-semibold">Wed</text>
                <text x="300" y="185" textAnchor="middle" className="fill-gray-muted text-[8px] tracking-wider uppercase font-heading font-semibold">Thu</text>
                <text x="370" y="185" textAnchor="middle" className="fill-gray-muted text-[8px] tracking-wider uppercase font-heading font-semibold">Fri</text>
                <text x="440" y="185" textAnchor="middle" className="fill-[#00FF87] text-[8px] tracking-wider uppercase font-heading font-bold">Sat (Peak)</text>

                {/* Y Axis */}
                <text x="32" y="34" textAnchor="end" className="fill-gray-muted text-[8px] font-mono">90%</text>
                <text x="32" y="84" textAnchor="end" className="fill-gray-muted text-[8px] font-mono">50%</text>
                <text x="32" y="134" textAnchor="end" className="fill-gray-muted text-[8px] font-mono">20%</text>
              </svg>
            )}
          </div>
        </section>

        {/* Grid: Complex Managers + Captain Directory */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* Left Column: Venue scheduler configs (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel p-5 rounded-2xl border-cyan-blue/15 text-left space-y-4">
              <h3 className="font-heading text-lg uppercase tracking-wider text-white flex items-center gap-1.5 font-bold">
                <Settings className="h-5 w-5 text-[#60EFFF]" /> Complex Hardware Configurator
              </h3>
              
              <div className="divide-y divide-white/5 space-y-4">
                {venues.map(v => (
                  <div key={v.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-4 first:pt-0">
                    <div className="text-left">
                      <h4 className="font-heading text-sm uppercase text-white font-bold leading-tight flex items-center gap-2">
                        {v.name}
                        <span className={`text-[8px] border px-2 py-0.5 rounded-full font-heading font-extrabold uppercase tracking-widest leading-none ${
                          v.status === "Available" 
                            ? "bg-green-600/10 border-green-500/20 text-green-400" 
                            : "bg-yellow-600/10 border-yellow-500/20 text-yellow-400"
                        }`}>
                          {v.status}
                        </span>
                      </h4>
                      <p className="text-[10px] text-gray-muted mt-1 leading-none">
                        Category: {v.category} Spec | Dimensions: {v.size}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Price Editor */}
                      {editingVenueId === v.id ? (
                        <div className="flex gap-1.5 items-center bg-[#040a06] border border-[#00FF87]/20 p-1 rounded-xl">
                          <input
                            type="number"
                            value={venuePriceInput}
                            onChange={(e) => setVenuePriceInput(parseInt(e.target.value))}
                            className="bg-transparent text-xs text-white font-mono outline-none w-16 text-center"
                          />
                          <button
                            onClick={() => handleSavePrice(v.id)}
                            className="p-1 rounded-lg bg-[#00FF87] hover:bg-[#00FF87]/90 text-[#040a06]"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditPrice(v)}
                          className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:border-[#00FF87]/20 text-[10px] font-heading font-bold uppercase tracking-wider text-gray-muted hover:text-white transition active:scale-95"
                        >
                          KES {v.pricePerHour}/hr
                        </button>
                      )}

                      {/* Status Toggle */}
                      <button
                        onClick={() => handleToggleVenueStatus(v.id)}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-heading font-bold uppercase tracking-wider transition active:scale-95 flex items-center gap-1 ${
                          v.status === "Available"
                            ? "bg-yellow-600/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-600 hover:text-white"
                            : "bg-green-600/10 border-green-500/20 text-green-400 hover:bg-green-600 hover:text-white"
                        }`}
                      >
                        <Wrench className="h-3 w-3" />
                        <span>{v.status === "Available" ? "Maintenance" : "Activate"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: User Management Directory (lg:col-span-4) */}
          <div className="lg:col-span-4 text-left">
            <div className="glass-panel p-5 rounded-2xl border-white/5 space-y-4">
              <h3 className="font-heading text-sm uppercase tracking-widest text-white flex items-center gap-1 font-bold">
                <Users className="h-4.5 w-4.5 text-[#60EFFF]" /> Captains Directory
              </h3>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-muted" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search registered captains..."
                  className="w-full bg-[#040a06]/85 border border-[#00FF87]/15 rounded-xl py-1.5 pl-8 pr-3 text-[10px] text-white outline-none focus:border-[#00FF87]/40 transition"
                />
              </div>

              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {filteredCaptains.map((c, idx) => (
                  <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5 text-xs text-left">
                    <div className="flex justify-between items-start leading-none">
                      <strong className="font-heading uppercase tracking-wide text-white">{c.name}</strong>
                      <span className="text-[8px] bg-[#60EFFF]/10 border border-[#60EFFF]/20 text-[#60EFFF] px-1.5 py-0.5 rounded uppercase font-heading font-extrabold tracking-wider">{c.level}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-muted leading-none">
                      <span>Phone: {c.phone}</span>
                      <span>Matches: {c.matches}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-1.5 mt-1 text-[9px] leading-none">
                      <span className="text-gray-muted">Credit Balance:</span>
                      <strong className="text-[#00FF87] font-mono font-bold tabular-nums">{formatCurrency(c.wallet)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
