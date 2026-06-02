"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Shield, 
  Zap, 
  Clock, 
  Calendar,
  MessageSquare,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Award,
  Wallet,
  CheckCircle,
  Plus
} from "lucide-react";
import { MockDatabase, MockCoach, MockReview } from "@/lib/mockData";
import { toast } from "sonner";

export default function CoachDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const coachId = params.id as string;

  const [coach, setCoach] = useState<MockCoach | null>(null);
  const [reviews, setReviews] = useState<MockReview[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  
  // Booking states
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState<60 | 90>(60);
  
  // Instant topup states
  const [topupInput, setTopupInput] = useState<string>("");
  const [isTopupLoading, setIsTopupLoading] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const dayAfterStr = new Date(Date.now() + 172800000).toISOString().slice(0, 10);

  useEffect(() => {
    const c = MockDatabase.getCoachById(coachId);
    if (c) {
      setCoach(c);
      setReviews(MockDatabase.getReviews(coachId));
    }
    setWalletBalance(MockDatabase.getWalletBalance());
    setSelectedDate(todayStr);

    // Poll wallet updates
    const walletInterval = setInterval(() => {
      setWalletBalance(MockDatabase.getWalletBalance());
    }, 1500);
    return () => clearInterval(walletInterval);
  }, [coachId]);

  if (!coach) {
    return (
      <div className="p-8 text-center bg-[#0A0F2C] min-h-screen text-[#F5F3FF] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-muted font-heading uppercase text-sm">Coach profile not found or offline</p>
        <Link href="/coaches" className="px-5 py-2.5 bg-[#60EFFF] text-[#040a06] rounded-xl font-heading text-xs font-bold uppercase">
          Back to Coaches Directory
        </Link>
      </div>
    );
  }

  const getCalculatedPrice = () => {
    if (duration === 60) return coach.pricePerHour;
    return Math.floor(coach.pricePerHour * 1.4); // 90 min has a 1.4x rate
  };

  const handleBookSession = () => {
    if (!selectedSlot) {
      toast.error("Please select a time slot first.");
      return;
    }

    const price = getCalculatedPrice();
    const balance = MockDatabase.getWalletBalance();

    if (balance < price) {
      toast.error(`Insufficient wallet funds! Deposit KES ${price - balance} to reserve Coach ${coach.name.split(" ")[1]}.`);
      return;
    }

    // Double booking verification
    const existingBookings = MockDatabase.getBookings();
    const isBooked = existingBookings.some(b => 
      b.targetId === coach.id && 
      b.slotDate === selectedDate && 
      b.slotTime === selectedSlot && 
      b.status === "CONFIRMED"
    );

    if (isBooked) {
      toast.error("This training slot is already reserved. Please select another slot.");
      return;
    }

    // Deduct and create booking
    MockDatabase.createBooking("coach", coach.id, selectedDate, selectedSlot);
    
    toast.success(`Session booked! 1-on-1 private training confirmed for ${selectedDate} at ${selectedSlot}.`);
    router.push("/dashboard");
  };

  const handleInstantTopup = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(topupInput);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setIsTopupLoading(true);
    toast.info("Sending M-Pesa push prompt... Enter your PIN to validate deposit.");
    
    setTimeout(() => {
      MockDatabase.addWalletTx(amt, "TOPUP", `Direct M-Pesa deposit for session checkout`);
      setWalletBalance(MockDatabase.getWalletBalance());
      setTopupInput("");
      setIsTopupLoading(false);
      toast.success("Wallet loaded successfully! Complete your coach session booking below.");
    }, 2000);
  };

  // Check booked slots
  const bookedSlots = MockDatabase.getBookings()
    .filter(b => b.targetId === coach.id && b.slotDate === selectedDate && b.status === "CONFIRMED")
    .map(b => b.slotTime);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-4 sm:p-8 bg-transparent min-h-screen text-[#F5F3FF] relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,135,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,135,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10 animate-fade-in text-left">
        
        {/* Back Link */}
        <Link
          href="/coaches"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#121e15]/30 border border-white/5 text-xs font-bold font-heading uppercase tracking-wider text-gray-muted hover:text-white hover:border-[#60EFFF]/20 transition active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Coaches
        </Link>

        {/* Details Grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* Left Column: Profile Bio & Certs (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Header profile info */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border-cyan-blue/15 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left relative overflow-hidden shadow-lg">
              <div className="absolute top-[-20%] right-[-10%] h-48 w-48 rounded-full bg-[#60EFFF] opacity-[0.03] blur-[60px] pointer-events-none" />
              
              <div className="h-28 w-28 rounded-2xl overflow-hidden shrink-0 border border-[#60EFFF]/20 shadow-md">
                <img src={coach.image} alt={coach.name} className="w-full h-full object-cover" />
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-2">
                  <div>
                    <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase text-white leading-tight">
                      {coach.name}
                    </h2>
                    <span className="inline-block bg-[#60EFFF]/10 border border-[#60EFFF]/20 text-[#60EFFF] px-2.5 py-0.5 rounded-lg text-[9px] font-heading font-extrabold uppercase tracking-widest mt-1">
                      {coach.specialty} Specialty Elite
                    </span>
                  </div>

                  <div className="bg-[#040a06]/40 px-2.5 py-1 rounded-xl border border-white/10 flex items-center gap-1 shrink-0">
                    <Star className="h-4 w-4 fill-[#00FF87] text-[#00FF87]" />
                    <span className="font-heading text-xs font-black text-white">{coach.rating}</span>
                    <span className="text-[9px] text-gray-muted">({coach.reviewsCount} reviews)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-center sm:justify-start text-xs text-gray-muted font-heading uppercase tracking-widest">
                  <span className="text-[#00FF87] font-semibold">Active Experience: {coach.experience}</span>
                  <span className="h-1.5 w-1.5 bg-white/20 rounded-full" />
                  <span>Nairobi Complex</span>
                </div>
              </div>
            </div>

            {/* Profile Bio */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border-cyan-blue/15 space-y-6">
              <div className="space-y-2">
                <h3 className="font-heading text-xs uppercase tracking-widest text-[#00FF87] flex items-center gap-1">
                  <Award className="h-4 w-4 text-glow-green" /> Professional Biography
                </h3>
                <p className="text-xs sm:text-sm text-gray-muted leading-relaxed">
                  {coach.bio}
                </p>
              </div>

              {/* Certifications Grid */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                <h3 className="font-heading text-xs uppercase tracking-widest text-[#60EFFF] flex items-center gap-1">
                  <GraduationCap className="h-4.5 w-4.5 text-glow-cyan" /> Academy Credentials & Licenses
                </h3>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {coach.certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 bg-white/5 border border-white/5 px-4 py-3 rounded-xl text-xs text-white font-heading font-semibold uppercase tracking-wider">
                      <CheckCircle className="h-4.5 w-4.5 text-[#00FF87] shrink-0" />
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Training expectations details */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border-cyan-blue/15 space-y-4 text-left">
              <h3 className="font-heading text-xs uppercase tracking-widest text-white">Private Session Guidelines</h3>
              <ul className="space-y-2.5 text-xs text-gray-muted font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-[#00FF87]/15 border border-[#00FF87]/30 text-[#00FF87] text-[10px] flex items-center justify-center font-heading font-black shrink-0">1</span>
                  <span><strong>Dedicated Field Space:</strong> The scheduled session fee includes designated premium training space. No additional court booking is required.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-[#00FF87]/15 border border-[#00FF87]/30 text-[#00FF87] text-[10px] flex items-center justify-center font-heading font-black shrink-0">2</span>
                  <span><strong>Equipment provided:</strong> All tactical boards, premium training cones, marker vests, and academy balls are provided by the coach.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-[#00FF87]/15 border border-[#00FF87]/30 text-[#00FF87] text-[10px] flex items-center justify-center font-heading font-black shrink-0">3</span>
                  <span><strong>Weather proof:</strong> In case of heavy rainfall, outdoor training sessions are automatically sorted into our Kilimani Indoor Dome.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Right Column: Dynamic Training Booking Widget (lg:col-span-4) */}
          <div className="lg:col-span-4 text-left space-y-6">
            
            {/* Wallet Quick Balance Header */}
            <div className="glass-panel p-4 rounded-2xl border-[#00FF87]/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4.5 w-4.5 text-[#00FF87]" />
                <span className="text-[10px] font-heading font-extrabold uppercase text-gray-muted tracking-wider">Captain Wallet Balance</span>
              </div>
              <span className="font-heading text-sm font-black text-[#00FF87] tabular-nums">
                {formatCurrency(walletBalance)}
              </span>
            </div>

            {/* Booking Calendar Widget */}
            <div className="glass-panel p-5 sm:p-6 rounded-3xl border-cyan-blue/15 space-y-6">
              
              <div className="space-y-1">
                <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Private Training Reservation</span>
                <span className="font-heading text-2xl font-black text-[#60EFFF] text-glow-cyan">
                  {formatCurrency(getCalculatedPrice())}
                </span>
                <span className="text-[10px] text-gray-muted"> / class</span>
              </div>

              <hr className="border-white/5" />

              {/* Session Duration Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase text-gray-muted tracking-widest font-heading font-extrabold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#60EFFF]" /> 1. Session Duration
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-[#040a06]/70 border border-white/5 rounded-xl p-1 shrink-0 select-none">
                  <button
                    onClick={() => setDuration(60)}
                    className={`py-2 text-[9px] font-heading font-bold uppercase tracking-wider rounded-lg transition-all ${
                      duration === 60 ? "bg-[#60EFFF] text-[#040a06]" : "text-gray-muted hover:text-white"
                    }`}
                  >
                    60 Minutes Block
                  </button>
                  <button
                    onClick={() => setDuration(90)}
                    className={`py-2 text-[9px] font-heading font-bold uppercase tracking-wider rounded-lg transition-all ${
                      duration === 90 ? "bg-[#60EFFF] text-[#040a06]" : "text-gray-muted hover:text-white"
                    }`}
                  >
                    90 Minutes Block
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase text-gray-muted tracking-widest font-heading font-extrabold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#60EFFF]" /> 2. Appointment Date
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#040a06]/70 border border-white/5 rounded-xl p-1 shrink-0 select-none">
                  <button
                    onClick={() => {
                      setSelectedDate(todayStr);
                      setSelectedSlot(null);
                    }}
                    className={`py-2 text-[9px] font-heading font-bold uppercase tracking-wider rounded-lg transition-all ${
                      selectedDate === todayStr ? "bg-[#60EFFF] text-[#040a06]" : "text-gray-muted hover:text-white"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDate(tomorrowStr);
                      setSelectedSlot(null);
                    }}
                    className={`py-2 text-[9px] font-heading font-bold uppercase tracking-wider rounded-lg transition-all ${
                      selectedDate === tomorrowStr ? "bg-[#60EFFF] text-[#040a06]" : "text-gray-muted hover:text-white"
                    }`}
                  >
                    Tomorrow
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDate(dayAfterStr);
                      setSelectedSlot(null);
                    }}
                    className={`py-2 text-[9px] font-heading font-bold uppercase tracking-wider rounded-lg transition-all ${
                      selectedDate === dayAfterStr ? "bg-[#60EFFF] text-[#040a06]" : "text-gray-muted hover:text-white"
                    }`}
                  >
                    {new Date(dayAfterStr).toLocaleDateString(undefined, { weekday: "short" })}
                  </button>
                </div>
              </div>

              {/* Slots selection */}
              <div className="space-y-3">
                <label className="block text-[10px] uppercase text-gray-muted tracking-widest font-heading font-extrabold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-[#00FF87]" /> 3. Available Slots
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {coach.slots.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = selectedSlot === slot;

                    return (
                      <button
                        key={slot}
                        onClick={() => !isBooked && setSelectedSlot(slot)}
                        disabled={isBooked}
                        className={`py-2.5 rounded-xl border text-[10px] font-bold font-heading tracking-wider uppercase transition-all duration-300 relative group active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                          isBooked
                            ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed"
                            : isSelected
                            ? "bg-[#60EFFF]/15 border-[#60EFFF] text-[#60EFFF] shadow-[0_0_10px_rgba(96,239,255,0.15)]"
                            : "bg-[#121e15]/20 border-[#60EFFF]/10 text-gray-muted hover:text-white hover:border-[#60EFFF]/30"
                        }`}
                      >
                        <span className={isBooked ? "line-through text-white/20" : ""}>{slot}</span>
                        <span className="text-[7px] uppercase tracking-wider font-semibold opacity-75 mt-0.5">
                          {isBooked ? "Reserved" : isSelected ? "Selected" : "Open Slot"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Settle Class trigger */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <button
                  onClick={handleBookSession}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#60EFFF] hover:bg-[#60EFFF]/90 text-[#040a06] font-heading font-black text-xs uppercase tracking-widest transition duration-300 active:scale-95 shadow-[0_0_20px_rgba(96,239,255,0.25)] flex items-center justify-center gap-2"
                >
                  <Zap className="h-4 w-4 fill-current text-glow-cyan" />
                  Settle Class Session
                </button>
              </div>

            </div>

            {/* Simulated instant M-Pesa Topup form (if funds are insufficient) */}
            {walletBalance < getCalculatedPrice() && (
              <div className="glass-panel p-5 rounded-2xl border-orange-500/20 text-left space-y-4 animate-pulse-subtle bg-orange-500/5">
                <div className="flex gap-2 items-center">
                  <Wallet className="h-4.5 w-4.5 text-orange-400" />
                  <h4 className="font-heading text-xs uppercase tracking-wider text-white font-bold">Topup Captain Wallet</h4>
                </div>
                <p className="text-[10px] text-gray-muted leading-relaxed">
                  Enter top-up amount to instantly cover Coach {coach.name.split(" ")[1]}'s session via simulated mobile checkout.
                </p>
                <form onSubmit={handleInstantTopup} className="flex gap-2">
                  <input
                    type="number"
                    value={topupInput}
                    onChange={(e) => setTopupInput(e.target.value)}
                    placeholder={`e.g. ${getCalculatedPrice() - walletBalance}`}
                    required
                    disabled={isTopupLoading}
                    className="w-full bg-[#040a06]/85 border border-orange-500/20 focus:border-orange-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isTopupLoading}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-heading font-extrabold text-[10px] uppercase tracking-widest transition active:scale-95 disabled:opacity-50 shrink-0 shadow-md"
                  >
                    {isTopupLoading ? "Loading..." : "Load KES"}
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
