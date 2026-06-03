"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  MapPin, 
  Award, 
  User, 
  Shield, 
  Trophy, 
  Wallet, 
  Bell, 
  Menu, 
  X, 
  TrendingUp 
} from "lucide-react";
import { MockDatabase } from "@/lib/mockData";
import { ThemeToggle } from "@/components/ThemeToggle";

export function DashboardNavigation() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/checkout") {
    return null;
  }
  const [walletBalance, setWalletBalance] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Initial fetch
    setWalletBalance(MockDatabase.getWalletBalance());
    setUnreadCount(MockDatabase.getNotifications().filter(n => !n.read).length);

    // Poll updates for interactive feel
    const interval = setInterval(() => {
      setWalletBalance(MockDatabase.getWalletBalance());
      setUnreadCount(MockDatabase.getNotifications().filter(n => !n.read).length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Venues", href: "/venues", icon: MapPin },
    { name: "Coaches", href: "/coaches", icon: Award },
    { name: "Betting Arena", href: "/betting", icon: Trophy },
    { name: "My Dashboard", href: "/dashboard", icon: User },
    { name: "Admin Panel", href: "/admin", icon: Shield },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <>
      {/* Desktop Sidebar (visible on md+) */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-64 flex-col bg-[#040a06]/90 border-r border-[#00FF87]/10 z-40 backdrop-blur-md">
        {/* Sidebar Header / Logo */}
        <div className="flex items-center gap-2 p-6 border-b border-[#00FF87]/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#00FF87] to-[#60EFFF] p-0.5 shadow-[0_0_12px_rgba(0,255,135,0.25)]">
            <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-[#040a06]">
              <span className="font-heading text-base font-bold text-[#00FF87]">KS</span>
            </div>
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1">
              <span className="text-[7px] uppercase font-bold tracking-widest text-[#00FF87] leading-none">Arena</span>
            </div>
            <p className="font-heading text-base font-extrabold tracking-tight uppercase text-white leading-none">
              Kahawa<span className="text-[#00FF87]"> Sport Arena</span>
            </p>
          </div>
        </div>

        {/* Wallet Widget */}
        <div className="p-4 mx-4 mt-6 rounded-2xl glass-panel border border-[#00FF87]/15 relative overflow-hidden bg-[#121e15]/40 shadow-[0_0_15px_rgba(0,255,135,0.02)]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00FF87]/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00FF87]/10 text-[#00FF87]">
              <Wallet className="h-4.5 w-4.5 text-glow-green" />
            </div>
            <div className="text-left">
              <span className="block text-[9px] uppercase tracking-widest text-gray-muted leading-none">Wallet Credit</span>
              <span className="font-heading text-base font-black text-[#00FF87] text-glow-green tracking-tight leading-none mt-1.5 block tabular-nums">
                {formatCurrency(walletBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-1.5 px-4 py-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold font-heading uppercase tracking-wider transition-all duration-300 relative group active:scale-95 ${
                  isActive
                    ? "bg-[#00FF87]/10 text-[#00FF87] text-glow-green border-l-2 border-[#00FF87]"
                    : "text-gray-muted hover:text-white-soft hover:bg-white/5 border-l-2 border-transparent"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-[#00FF87]" : "text-gray-muted"}`} />
                {item.name}
                {item.name === "Betting Arena" && (
                  <span className="ml-auto flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
                {item.name === "My Dashboard" && unreadCount > 0 && (
                  <span className="ml-auto bg-[#60EFFF] text-[#040a06] text-[9px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(96,239,255,0.4)]">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-[#00FF87]/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-[#60EFFF]/10 border border-[#60EFFF]/20 flex items-center justify-center text-[#60EFFF]">
              <User className="h-4 w-4" />
            </div>
            <div className="text-left overflow-hidden">
              <span className="block text-[10px] text-white font-bold leading-tight font-heading uppercase">Active Captain</span>
              <span className="block text-[8px] text-gray-muted font-mono leading-none truncate">kes-wallet-cap</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile Top Header (visible on screens < md) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#040a06]/95 border-b border-[#00FF87]/10 z-40 backdrop-blur-md flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00FF87] to-[#60EFFF] p-0.5 shadow-[0_0_10px_rgba(0,255,135,0.2)]">
            <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-[#040a06]">
              <span className="font-heading text-xs font-bold text-[#00FF87]">KS</span>
            </div>
          </div>
          <p className="font-heading text-sm font-extrabold uppercase text-white tracking-tight leading-none">
            Kahawa<span className="text-[#00FF87]"> Sport Arena</span>
          </p>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {/* Mini Wallet */}
          <Link href="/dashboard" className="flex items-center gap-1.5 bg-[#121e15]/60 border border-[#00FF87]/15 rounded-lg px-2.5 py-1 text-[#00FF87] text-[10px] font-heading font-extrabold uppercase">
            <Wallet className="h-3.5 w-3.5" />
            <span className="tabular-nums">{formatCurrency(walletBalance)}</span>
          </Link>

          {/* Toggle Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white transition active:scale-90"
          >
            {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-[#040a06]/98 flex flex-col justify-center items-center gap-6 pt-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3.5 text-base font-bold font-heading uppercase tracking-wider py-2 transition-all active:scale-95 ${
                  isActive ? "text-[#00FF87] text-glow-green" : "text-gray-muted hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Mobile Bottom Navigation (visible on screens < md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#040a06]/95 border-t border-[#00FF87]/10 z-40 backdrop-blur-md flex items-center justify-around select-none">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all active:scale-90 ${
                isActive ? "text-[#00FF87]" : "text-gray-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[8px] font-heading font-semibold uppercase tracking-widest scale-90">{item.name.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer to avoid desktop main content pushing behind fixed sidebar (added as simple padding to child pages) */}
    </>
  );
}
export default DashboardNavigation;
