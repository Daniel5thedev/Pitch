"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Canvas3DFootball } from "@/components/Canvas3DFootball";
import { 
  ChevronRight, 
  ShieldCheck, 
  Cpu, 
  Trophy, 
  Zap, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Plus, 
  Minus,
  MessageSquare,
  Users,
  Award,
  Sparkles
} from "lucide-react";
import { MockDatabase, MockVenue, MockCoach } from "@/lib/mockData";
import { toast } from "sonner";

export default function LandingPage() {
  const [featuredVenues, setFeaturedVenues] = useState<MockVenue[]>([]);
  const [popularCoaches, setPopularCoaches] = useState<MockCoach[]>([]);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [showLocalBall, setShowLocalBall] = useState(false);

  useEffect(() => {
    // Check if splash has already played or if it completes
    const checkSplash = () => {
      if (sessionStorage.getItem("kahawa-splash-played") === "true") {
        setShowLocalBall(true);
      }
    };
    
    checkSplash();
    const interval = setInterval(checkSplash, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Seed and fetch featured venues (top 3) and coaches (top 3)
    setFeaturedVenues(MockDatabase.getVenues().slice(0, 3));
    setPopularCoaches(MockDatabase.getCoaches().slice(0, 3));
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    toast.success("Subscribed successfully! Welcome to the Captain's club.");
    setEmailInput("");
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqData = [
    {
      q: "How does the 5-Minute Hold Guarantee work?",
      a: "When you select an open slot and click 'Lock Slot', our database creates an exclusive reservation hold under your session. Nobody else can book or view this slot for exactly 5 minutes, giving you plenty of time to enter your phone number and approve the M-Pesa checkout pin pop-up."
    },
    {
      q: "What happens if a pitch booking overlaps?",
      a: "Our Split-Pitch Sorter algorithm automatically resolves overlaps! Booking a full-sized 11-a-side pitch automatically deactivates and hides all smaller child 5-a-side slots for that time window, guaranteeing absolutely zero physical conflicts."
    },
    {
      q: "Can I cancel a booking and receive a refund?",
      a: "Yes! Bookings can be cancelled up to 12 hours before kickoff directly from your User Dashboard. The full amount is credited instantly to your Captain Wallet, which you can use to book subsequent slots or sessions."
    },
    {
      q: "How do I book sessions with professional coaches?",
      a: "Simply navigate to the Coaches page, select your preferred coach (UEFA/CAF certified), select a time slot matching their real-time calendar availability, and checkout via wallet balance or M-Pesa."
    }
  ];

  const pricingTiers = [
    {
      name: "Casual Player",
      price: "0",
      description: "Pay as you play model. Perfect for occasional weekend matches with friends.",
      features: [
        "Standard hourly booking rates",
        "5-Minute Hold Lock Guarantee",
        "Access to virtual Betting Arena",
        "Standard mobile checkout"
      ],
      cta: "Browse Venues",
      href: "/venues",
      popular: false
    },
    {
      name: "Club Captain",
      price: "1,499",
      description: "Optimized for team managers, squad organisers, and regular tournament players.",
      features: [
        "Priority slot holding (10-Min Locks)",
        "5% cashback credited to your wallet",
        "One-click roster invites & split pay",
        "Advanced match analytics",
        "Free match bibs & ball rentals"
      ],
      cta: "Get Captain Status",
      href: "/dashboard",
      popular: true
    },
    {
      name: "Pro Academy Elite",
      price: "3,499",
      description: "Designed for competitive clubs, youth academies, and pro-career aspirants.",
      features: [
        "10% booking cashback on all courts",
        "2 free monthly coach training sessions",
        "Priority reservation (up to 30 days ahead)",
        "Premium profile badge & rank status",
        "VIP locker-room access"
      ],
      cta: "Join Pro Elite",
      href: "/dashboard",
      popular: false
    }
  ];

  return (
    <main className="min-h-screen bg-transparent text-white-soft overflow-x-hidden relative selection:bg-[#00FF87]/30">
      {/* Full-bleed Hero Section */}
      <section
        className="relative w-full overflow-hidden min-h-screen flex flex-col justify-between px-4 sm:px-6 py-6 sm:py-10"
        style={{
          backgroundImage: "linear-gradient(180deg, rgba(4,10,6,0.48), rgba(4,10,6,0.75)), url('https://i.postimg.cc/k4WdyrmT/Chat-GPT-Image-May-29-2026-02-56-20-PM.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Animated Background Layers */}
        <div className="absolute inset-0 bg-[#040a06]/60 animate-fade-in" style={{ animationDuration: '0.6s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,239,255,0.16),_transparent_45%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,135,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,135,0.025)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-[-5%] left-[20%] h-[35rem] w-[35rem] rounded-full bg-[#60EFFF] opacity-[0.04] blur-[150px] pointer-events-none animate-pulse-glow" style={{ animationDuration: '4s' }} />
        <div className="absolute top-[-5%] right-[20%] h-[35rem] w-[35rem] rounded-full bg-[#00FF87] opacity-[0.04] blur-[150px] pointer-events-none animate-pulse-glow" style={{ animationDuration: '5s', animationDelay: '0.3s' }} />
        <div className="absolute top-[25%] left-[2%] h-80 w-[1px] bg-gradient-to-b from-transparent via-[#00FF87]/20 to-transparent rotate-[30deg] pointer-events-none animate-fade-in" style={{ animationDuration: '1.2s', animationDelay: '0.2s' }} />
        <div className="absolute top-[35%] right-[2%] h-80 w-[1px] bg-gradient-to-b from-transparent via-[#60EFFF]/20 to-transparent rotate-[-30deg] pointer-events-none animate-fade-in" style={{ animationDuration: '1.2s', animationDelay: '0.3s' }} />
        <div className="relative z-10 flex flex-col justify-between w-full h-full mx-auto max-w-6xl">
          {/* Navigation / Header */}
          <div className="liquid-text-box p-4 rounded-[2rem] border border-[#00FF87]/15 mb-8 animate-slide-in-left" style={{ animationDuration: '0.8s' }}>
            <nav className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#00FF87] to-[#60EFFF] p-0.5 shadow-[0_0_12px_rgba(0,255,135,0.25)]">
                  <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-[#040a06]">
                    <span className="font-heading text-base font-bold text-[#00FF87]">KS</span>
                  </div>
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="text-[7px] uppercase font-bold tracking-widest text-[#00FF87] leading-none">Arena</span>
                  </div>
                  <p className="font-heading text-lg font-extrabold tracking-tight uppercase text-white leading-none">
                    Kahawa<span className="text-[#00FF87]"> Sport Arena</span>
                  </p>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-8 text-xs font-heading font-semibold uppercase tracking-wider text-gray-muted">
                <Link href="/" className="text-[#00FF87] transition hover:text-white">Home</Link>
                <Link href="/venues" className="hover:text-[#00FF87] transition">Venues</Link>
                <Link href="/coaches" className="hover:text-[#00FF87] transition">Coaches</Link>
                <Link href="/betting" className="hover:text-[#00FF87] transition">Betting Arena</Link>
                <Link href="/dashboard" className="hover:text-[#00FF87] transition">Dashboard</Link>
                <Link href="/admin" className="hover:text-[#00FF87] transition">Admin</Link>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link
                  href="/venues"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00FF87] text-[#040a06] hover:bg-[#00FF87]/90 text-xs font-bold font-heading uppercase tracking-wider transition active:scale-95 shadow-[0_0_15px_rgba(0,255,135,0.35)] hover:shadow-[0_0_25px_rgba(0,255,135,0.5)] hover:translate-y-[-1px]"
                >
                  Get Started
                  <ChevronRight className="h-4 w-4 stroke-[3px]" />
                </Link>
              </div>
            </nav>
          </div>

          {/* Hero Section Grid */}
          <section className="grid gap-8 lg:grid-cols-12 items-center flex-1 my-12 sm:my-20">
            <div className="lg:col-span-4 order-1 animate-slide-in-left" style={{ animationDuration: '0.8s' }}>
              <div className="liquid-text-box p-6 sm:p-8 rounded-[2.5rem] border border-[#00FF87]/20 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF87]/10 border border-[#00FF87]/20 animate-fade-in-up" style={{ animationDuration: '0.6s' }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF87] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF87]" />
                  </span>
                  <span className="text-[9px] sm:text-xs font-heading font-extrabold uppercase tracking-widest text-[#00FF87] text-glow-green">
                  Next-Gen Sports Venue Hub
                </span>
                </div>

                <div className="space-y-1">
                  <h1 className="font-heading text-6xl sm:text-[90px] font-black tracking-tight leading-[0.8] text-white uppercase animate-fade-in-up" style={{ animationDuration: '0.7s', animationDelay: '0.1s' }}>
                  LOCK
                </h1>
                <h1 className="font-heading text-6xl sm:text-[90px] font-black tracking-tight leading-[0.8] text-[#00FF87] text-glow-green uppercase animate-fade-in-up animate-pulse-glow" style={{ animationDuration: '0.7s', animationDelay: '0.2s' }}>
                  YOUR
                </h1>
                <h1 className="font-heading text-6xl sm:text-[90px] font-black tracking-tight leading-[0.8] text-white uppercase animate-fade-in-up" style={{ animationDuration: '0.7s', animationDelay: '0.3s' }}>
                  GAME
                </h1>
                </div>

                <p className="text-xs sm:text-sm text-gray-muted leading-relaxed max-w-sm animate-fade-in-up" style={{ animationDuration: '0.8s', animationDelay: '0.4s' }}>
                Nairobi's elite real-time multi-sport booking dashboard. Lock premium pitches, schedule 1-on-1 certified training sessions, and settle payments instantly.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2 animate-fade-in-up" style={{ animationDuration: '0.8s', animationDelay: '0.5s' }}>
                  <Link
                    href="/venues"
                    className="h-12 flex items-center justify-center gap-2 rounded-xl btn-electric px-6 font-heading text-xs uppercase tracking-widest text-[#040a06] shadow-[0_0_15px_rgba(0,255,135,0.25)] transition duration-300 hover:shadow-[0_0_30px_rgba(0,255,135,0.4)] hover:translate-y-[-2px]"
                  >
                    Book Court Now
                    <ChevronRight className="h-4 w-4 stroke-[3px]" />
                  </Link>
                  <Link
                    href="/betting"
                    className="h-12 flex items-center justify-center gap-2 rounded-xl border border-cyan-blue/20 hover:border-cyan-blue/40 px-6 font-heading text-xs uppercase tracking-widest text-white hover:bg-[#121e15]/40 transition active:scale-95"
                  >
                    Betting Arena
                  </Link>
                </div>
              </div>
            </div>

            {/* Middle Column: Premium Action Football Player */}
            <div className="lg:col-span-5 flex justify-center order-2 w-full relative group animate-slide-in-right" style={{ animationDuration: '0.9s' }}>
              {/* Ambient Glows */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#00FF87]/20 to-[#60EFFF]/20 rounded-3xl filter blur-2xl opacity-60 group-hover:opacity-80 transition duration-500 pointer-events-none animate-float" />
              
              {/* Image Frame with Glassmorphism */}
              <div 
                id="featured-pro-ball-target"
                className="w-full max-w-[420px] aspect-[4/5] rounded-3xl overflow-hidden glass-panel border border-[#00FF87]/20 relative shadow-[0_20px_50px_rgba(0,0,0,0.3)] group-hover:border-[#00FF87]/40 transition duration-500 flex items-center justify-center group-hover:shadow-[0_20px_80px_rgba(0,255,135,0.3)]"
              >
                <img 
                  src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1000&auto=format&fit=crop" 
                  alt="Elite Soccer Player in Action" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  style={{ opacity: showLocalBall ? 0.35 : 1.0, transition: 'opacity 0.8s ease' }}
                />
                {/* Overlay styling for that dramatic pro sports feel */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#040a06]/90 via-transparent to-transparent pointer-events-none" />
                
                {/* 3D Rotating Football overlay */}
                {showLocalBall && (
                  <div className="absolute inset-0 flex items-center justify-center p-6 animate-fade-in pointer-events-none shadow-[0_0_80px_rgba(0,255,135,0.18)]">
                    <Canvas3DFootball size={300} />
                  </div>
                )}
                
                {/* Floating badges on the player image */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between animate-fade-in-up" style={{ animationDuration: '1s', animationDelay: '0.6s' }}>
                  <div className="flex items-center gap-2 bg-[#040a06]/85 border border-[#00FF87]/30 px-3.5 py-2 rounded-xl shadow-lg backdrop-blur-md hover:bg-[#040a06]/95 transition">
                    <Sparkles className="h-4 w-4 text-[#00FF87] animate-pulse" />
                    <div className="text-left">
                      <span className="block text-[9px] uppercase tracking-wider text-[#00FF87] font-heading font-black leading-none">Featured Pro</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#040a06]/85 border border-[#60EFFF]/30 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1.5 hover:bg-[#040a06]/95 transition">
                    <ShieldCheck className="h-4 w-4 text-[#60EFFF]" />
                    <span className="font-heading text-xs font-bold text-white uppercase tracking-wider">Verified Athlete</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Custom stats sidebar */}
            <div className="lg:col-span-3 flex flex-col gap-4 order-3 w-full lg:pl-4">
              
              <div className="glass-panel p-5 rounded-2xl border-cyan-blue/10 flex flex-col justify-center items-center text-center relative overflow-hidden h-24 lg:h-28 shadow-lg animate-fade-in-up hover:shadow-lg hover:border-cyan-blue/20 transition" style={{ animationDuration: '0.8s', animationDelay: '0.1s' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00FF87]/5 to-transparent pointer-events-none" />
                <span className="block text-4xl lg:text-5xl font-heading font-black text-[#00FF87] text-glow-green tracking-tight">
                  6+
                </span>
                <span className="block text-[9px] uppercase tracking-widest text-white font-heading font-semibold mt-1">
                  Elite Venues
                </span>
              </div>

              <div className="glass-panel p-5 rounded-2xl border-cyan-blue/10 flex flex-col justify-center items-center text-center relative overflow-hidden h-24 lg:h-28 shadow-lg animate-fade-in-up hover:shadow-lg hover:border-cyan-blue/20 transition" style={{ animationDuration: '0.8s', animationDelay: '0.2s' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#60EFFF]/5 to-transparent pointer-events-none" />
                <span className="block text-4xl lg:text-5xl font-heading font-black text-[#60EFFF] text-glow-cyan tracking-tight">
                  15+
                </span>
                <span className="block text-[9px] uppercase tracking-widest text-white font-heading font-semibold mt-1">
                  Certified Coaches
                </span>
              </div>

              <div className="glass-panel p-5 rounded-2xl border-cyan-blue/10 flex flex-col justify-center items-center text-center relative overflow-hidden h-24 lg:h-28 shadow-lg animate-fade-in-up hover:shadow-lg hover:border-cyan-blue/20 transition" style={{ animationDuration: '0.8s', animationDelay: '0.3s' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00FF87]/5 to-transparent pointer-events-none" />
                <span className="block text-4xl lg:text-5xl font-heading font-black text-[#00FF87] text-glow-green tracking-tight">
                  5,000+
                </span>
                <span className="block text-[9px] uppercase tracking-widest text-white font-heading font-semibold mt-1">
                  Match Bookings
                </span>
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* Rest of the page content */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">

      <section className="mb-24 sm:mb-32 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="liquid-text-box p-6 rounded-[2rem] border border-[#00FF87]/15 text-left space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-heading font-extrabold uppercase tracking-widest text-[#00FF87]">
                <Sparkles className="h-3.5 w-3.5" /> Featured Sports Complexes
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-white">
                Book Championship Courts
              </h2>
              <p className="text-xs sm:text-sm text-gray-muted max-w-xl">
                Choose from our handpicked sports venues, built to official FIBA, FIFA, and Olympic specifications. Settle holds instantly with guaranteed overlaps sorting.
              </p>
            </div>
            <Link
              href="/venues"
              className="inline-flex items-center gap-2 text-xs font-bold font-heading uppercase tracking-wider text-[#00FF87] hover:text-[#60EFFF] transition"
            >
              See All Venues <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {featuredVenues.map((venue) => (
              <div 
                key={venue.id}
                className="glass-panel rounded-2xl border-cyan-blue/10 overflow-hidden flex flex-col justify-between glass-card-hover group relative shadow-lg"
              >
                <div>
                  {/* Image container */}
                  <div className="h-48 w-full overflow-hidden relative">
                    <img 
                      src={venue.image} 
                      alt={venue.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-4 left-4 bg-[#040a06]/85 border border-[#00FF87]/20 px-2.5 py-1 rounded-lg text-[#00FF87] text-[10px] font-heading font-extrabold uppercase tracking-widest">
                      {venue.category}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-[#040a06]/85 border border-white/10 px-2 py-1 rounded-lg text-white text-[10px] font-heading font-bold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-[#00FF87] text-[#00FF87]" />
                      {venue.rating}
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="p-5 text-left space-y-3">
                    <h3 className="font-heading text-lg uppercase tracking-wide text-white group-hover:text-[#00FF87] transition">
                      {venue.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-muted text-xs">
                      <MapPin className="h-3.5 w-3.5 text-[#60EFFF]" />
                      <span>{venue.location.split(",")[0]}</span>
                      <span className="h-1 w-1 bg-white/20 rounded-full" />
                      <span>{venue.size}</span>
                    </div>
                    <p className="text-[11px] text-gray-muted leading-relaxed line-clamp-2">
                      {venue.description}
                    </p>
                  </div>
                </div>

                {/* Footer details */}
                <div className="px-5 pb-5 pt-3 border-t border-white/5 flex items-center justify-between text-left">
                  <div>
                    <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Hourly Rate</span>
                    <span className="font-heading text-base font-black text-[#00FF87] text-glow-green">
                      KES {venue.pricePerHour}
                    </span>
                  </div>
                  <Link
                    href={`/venues/${venue.id}`}
                    className="px-4 py-2 rounded-xl bg-white/5 group-hover:bg-[#00FF87] text-white group-hover:text-[#040a06] text-[10px] font-heading font-bold uppercase tracking-wider transition active:scale-95 shadow-md flex items-center gap-1"
                  >
                    View Court
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Verified Coaches Section */}
        <section className="mb-24 sm:mb-32 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="liquid-text-box p-6 rounded-[2rem] border border-[#00FF87]/15 text-left space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-heading font-extrabold uppercase tracking-widest text-[#60EFFF]">
                <Award className="h-3.5 w-3.5" /> Tactical Development
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-white">
                Learn From Certified Pros
              </h2>
              <p className="text-xs sm:text-sm text-gray-muted max-w-xl">
                1-on-1 private classes led by UEFA, CAF, and NCSF licensed coaches. Perfect your shooting geometry, tactical awareness, or physical speed metrics.
              </p>
            </div>
            <Link
              href="/coaches"
              className="inline-flex items-center gap-2 text-xs font-bold font-heading uppercase tracking-wider text-[#60EFFF] hover:text-[#00FF87] transition"
            >
              See All Coaches <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {popularCoaches.map((coach) => (
              <div 
                key={coach.id}
                className="glass-panel rounded-2xl border-cyan-blue/10 overflow-hidden flex flex-col justify-between glass-card-hover group relative shadow-lg"
              >
                <div>
                  <div className="h-56 w-full overflow-hidden relative">
                    <img 
                      src={coach.image} 
                      alt={coach.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-4 left-4 bg-[#040a06]/85 border border-[#60EFFF]/20 px-2.5 py-1 rounded-lg text-[#60EFFF] text-[10px] font-heading font-extrabold uppercase tracking-widest">
                      {coach.specialty} Specialist
                    </div>
                  </div>

                  <div className="p-5 text-left space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-heading text-lg uppercase tracking-wide text-white group-hover:text-[#60EFFF] transition">
                        {coach.name}
                      </h3>
                      <div className="bg-[#040a06]/50 px-2 py-0.5 rounded text-[#00FF87] text-[10px] font-heading font-bold flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" /> {coach.rating}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {coach.certifications.slice(0, 2).map((cert, i) => (
                        <span key={i} className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-muted uppercase tracking-wider font-heading">
                          {cert}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-muted leading-relaxed line-clamp-2">
                      {coach.bio}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-white/5 flex items-center justify-between text-left">
                  <div>
                    <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Experience</span>
                    <span className="font-heading text-base font-bold text-white">
                      {coach.experience}
                    </span>
                  </div>
                  <Link
                    href={`/coaches/${coach.id}`}
                    className="px-4 py-2 rounded-xl bg-white/5 group-hover:bg-[#60EFFF] text-white group-hover:text-[#040a06] text-[10px] font-heading font-bold uppercase tracking-wider transition active:scale-95 shadow-md flex items-center gap-1"
                  >
                    Schedule Session
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section id="features" className="space-y-12 mb-24 sm:mb-32">
          <div className="liquid-text-box p-6 rounded-[2rem] border border-[#00FF87]/15 text-center max-w-xl mx-auto space-y-2">
            <h2 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-white">
              Futuristic Sport Tech Architecture
            </h2>
            <p className="text-xs sm:text-sm text-gray-muted leading-relaxed">
              Engineered to resolve conflicts, guarantee mobile money payments, and manage reservations in real-time.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            
            <div className="glass-panel p-6 rounded-2xl border-cyan-blue/10 glass-card-hover text-left flex flex-col justify-between h-56 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00FF87]/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00FF87]/10 border border-[#00FF87]/20 text-[#00FF87]">
                <Cpu className="h-5.5 w-5.5 text-glow-green" />
              </div>
              <div>
                <h3 className="font-heading text-lg uppercase tracking-wider text-white mb-1.5">Split-Pitch Sorter</h3>
                <p className="text-[11px] text-gray-muted leading-relaxed">
                  Calculates physical layout dimensions automatically. Booking the full 11-a-side pitch instantly hides overlapping child 5-a-side slots.
                </p>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-cyan-blue/10 glass-card-hover text-left flex flex-col justify-between h-56 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
                <Zap className="h-5.5 w-5.5 text-[#FF6B2C] text-glow-orange" />
              </div>
              <div>
                <h3 className="font-heading text-lg uppercase tracking-wider text-white mb-1.5">Guaranteed Holds</h3>
                <p className="text-[11px] text-gray-muted leading-relaxed">
                  Locking a court holds the window exclusively for 5 minutes. The database auto-releases the slot if the M-Pesa checkout session expires.
                </p>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-cyan-blue/10 glass-card-hover text-left flex flex-col justify-between h-56 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#60EFFF]/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#60EFFF]/10 border border-[#60EFFF]/20 text-[#60EFFF]">
                <Trophy className="h-5.5 w-5.5 text-glow-cyan" />
              </div>
              <div>
                <h3 className="font-heading text-lg uppercase tracking-wider text-white mb-1.5">Arena Odds Settle</h3>
                <p className="text-[11px] text-gray-muted leading-relaxed">
                  Place stakes on live simulated match trackers. Odds adjust dynamically, and bets settle instantly back to your profile wallet at full-time.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Pricing Tiers Section */}
        <section className="mb-24 sm:mb-32 space-y-12">
          <div className="liquid-text-box p-6 rounded-[2rem] border border-[#00FF87]/15 text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#00FF87]">Pricing Plans</span>
            <h2 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-white">
              Choose Your Captain Tier
            </h2>
            <p className="text-xs sm:text-sm text-gray-muted leading-relaxed">
              Unlock exclusive cashbacks, extended priority holds, free equipment rentals, and direct coaching perks.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {pricingTiers.map((tier, idx) => (
              <div 
                key={idx}
                className={`glass-panel rounded-2xl p-6 text-left flex flex-col justify-between relative overflow-hidden transition-all duration-300 shadow-xl ${
                  tier.popular 
                    ? "border-[#00FF87] bg-[#121e15]/20 shadow-[0_0_25px_rgba(0,255,135,0.08)] scale-105 z-10" 
                    : "border-cyan-blue/10"
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-4 right-4 bg-[#00FF87] text-[#040a06] text-[8px] font-heading font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                    Most Popular
                  </div>
                )}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-heading text-xl uppercase tracking-wider text-white font-bold">{tier.name}</h3>
                    <p className="text-[11px] text-gray-muted leading-relaxed mt-1">{tier.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-heading font-black text-white">KES</span>
                    <span className="text-5xl font-heading font-black text-white tracking-tight">{tier.price}</span>
                    <span className="text-xs text-gray-muted">/month</span>
                  </div>

                  <hr className="border-white/5" />

                  <ul className="space-y-3">
                    {tier.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2.5 text-xs text-gray-muted">
                        <CheckCircle2 className="h-4.5 w-4.5 text-[#00FF87] shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link
                    href={tier.href}
                    className={`w-full py-3 px-4 rounded-xl text-center text-xs font-bold font-heading uppercase tracking-widest block transition active:scale-95 ${
                      tier.popular 
                        ? "bg-[#00FF87] text-[#040a06] hover:bg-[#00FF87]/90 shadow-[0_0_15px_rgba(0,255,135,0.25)]" 
                        : "bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-24 sm:mb-32 space-y-12">
          <div className="liquid-text-box p-6 rounded-[2rem] border border-[#00FF87]/15 text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#60EFFF]">Testimonials</span>
            <h2 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-white">
              Loved By Elite Athletes
            </h2>
            <p className="text-xs sm:text-sm text-gray-muted leading-relaxed">
              Read how local captains, team managers, and pro athletes optimize their game schedules with Kahawa Sport Arena.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="glass-panel p-6 rounded-2xl border-cyan-blue/10 flex flex-col justify-between text-left h-52 shadow-md">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#00FF87] text-[#00FF87]" />
                ))}
              </div>
              <p className="text-[11px] text-gray-muted italic leading-relaxed">
                "As an academy director, booking court schedules used to be an administrative nightmare. The overlapping prevention sorting here completely solved double-bookings. Truly next-level!"
              </p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-800 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80" alt="User" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-white font-heading uppercase">Coach Charles Obwaka</span>
                  <span className="block text-[9px] text-gray-muted">Vanguard Youth Director</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-cyan-blue/10 flex flex-col justify-between text-left h-52 shadow-md">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#00FF87] text-[#00FF87]" />
                ))}
              </div>
              <p className="text-[11px] text-gray-muted italic leading-relaxed">
                "Depositing money via M-Pesa is instantaneous. Tapping 'Lock Slot' holds our five-a-side window for 5 minutes, allowing my guys to pool cash and pay comfortably."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-800 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80" alt="User" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-white font-heading uppercase">Cynthia Wambui</span>
                  <span className="block text-[9px] text-gray-muted">Freetown FC Captain</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-cyan-blue/10 flex flex-col justify-between text-left h-52 shadow-md">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#00FF87] text-[#00FF87]" />
                ))}
              </div>
              <p className="text-[11px] text-gray-muted italic leading-relaxed">
                "The 1-on-1 tactics classes with Coach David are fantastic. I was able to book his session directly on his live calendar. The UI design is incredibly slick."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-800 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80" alt="User" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-white font-heading uppercase">Brian Ombati</span>
                  <span className="block text-[9px] text-gray-muted">Midfielder, Ligi Ndogo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive FAQ Accordion */}
        <section className="mb-24 sm:mb-32 max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#00FF87]">F.A.Q.</span>
            <h2 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-white">
              Got Questions? We Settle Them
            </h2>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  className="glass-panel rounded-2xl border-cyan-blue/10 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 flex items-center justify-between text-left font-heading text-sm sm:text-base font-bold uppercase tracking-wider text-white hover:text-[#00FF87] transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <Minus className="h-4 w-4 text-[#00FF87]" /> : <Plus className="h-4 w-4 text-[#00FF87]" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-gray-muted leading-relaxed border-t border-white/5 pt-4 animate-fade-in text-left">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Newsletter Signup Form */}
        <section className="mb-20 glass-panel p-8 rounded-3xl border-cyan-blue/15 relative overflow-hidden text-center max-w-4xl mx-auto shadow-xl">
          <div className="absolute top-[-50%] left-[-50%] h-[30rem] w-[30rem] rounded-full bg-[#00FF87] opacity-[0.02] blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-50%] right-[-50%] h-[30rem] w-[30rem] rounded-full bg-[#60EFFF] opacity-[0.02] blur-[100px] pointer-events-none" />
          
          <div className="max-w-xl mx-auto space-y-6 relative z-10">
            <h2 className="font-heading text-2xl sm:text-3xl uppercase tracking-wider text-white">
              Join the Captain's Club
            </h2>
            <p className="text-xs sm:text-sm text-gray-muted">
              Subscribe to get notified first on new venue listings, special slot discount codes, and monthly coach newsletters. No spam, ever.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full bg-[#040a06]/80 border border-cyan-blue/20 rounded-xl px-4 py-3 text-xs sm:text-sm text-white outline-none focus:border-[#00FF87]/50 transition duration-300"
              />
              <button
                type="submit"
                className="h-11 sm:h-auto px-6 rounded-xl bg-[#00FF87] hover:bg-[#00FF87]/90 text-[#040a06] font-heading font-black text-xs uppercase tracking-widest transition duration-300 active:scale-95 shrink-0 shadow-[0_0_15px_rgba(0,255,135,0.2)]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#00FF87]/10 pt-10 text-left relative z-10 bg-slate-950 text-white rounded-3xl p-8">
          <div className="grid gap-8 md:grid-cols-4 pb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00FF87] to-[#60EFFF] p-0.5">
                  <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-[#040a06]">
                    <span className="font-heading text-sm font-bold text-[#00FF87]">KS</span>
                  </div>
                </div>
                <p className="font-heading text-base font-extrabold uppercase text-white tracking-tight leading-none">
                  Kahawa<span className="text-[#00FF87]"> Sport Arena</span>
                </p>
              </div>
              <p className="text-[10px] text-gray-muted leading-relaxed">
                Premium sports scheduling engine. Settle conflicts physically with sorting logic and experience lag-free mobile checkout.
              </p>
            </div>

            <div>
              <h4 className="font-heading text-xs uppercase tracking-widest text-[#00FF87] mb-3">Quick Directory</h4>
              <ul className="space-y-2 text-[10px] text-gray-muted uppercase tracking-wider font-heading font-semibold">
                <li><Link href="/venues" className="hover:text-white transition">All Venues</Link></li>
                <li><Link href="/coaches" className="hover:text-white transition">Expert Coaches</Link></li>
                <li><Link href="/betting" className="hover:text-white transition">Betting Arena</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition">My Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading text-xs uppercase tracking-widest text-[#60EFFF] mb-3">Contact Support</h4>
              <ul className="space-y-2 text-[10px] text-gray-muted">
                <li className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-[#60EFFF]" />
                  <span>+254 (0) 712 345 678</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-[#60EFFF]" />
                  <span>support@kahawasportarena.co.ke</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-[#60EFFF]" />
                  <span>Ngong Road, Adams, Nairobi</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading text-xs uppercase tracking-widest text-white mb-3">Legal & Safe Play</h4>
              <p className="text-[9px] text-gray-muted leading-relaxed">
                Virtual Arena betting is restricted to users 18 years and above. Settle payments safely via verified mobile money wallets. Play responsibly.
              </p>
            </div>
          </div>

          <div className="border-t border-[#00FF87]/5 py-6 text-center text-[10px] text-gray-muted font-heading uppercase tracking-widest flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>© 2026 Kahawa Sport Arena · Powered by Local Demo Mode & M-Pesa.</span>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  sessionStorage.removeItem("kahawa-splash-played");
                  window.location.reload();
                }}
                className="hover:text-[#00FF87] text-[#60EFFF] transition underline cursor-pointer active:scale-95"
              >
                Replay Splash Intro
              </button>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
