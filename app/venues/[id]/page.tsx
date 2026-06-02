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
  Wifi,
  Award,
  CircleCheck,
  Send
} from "lucide-react";
import { MockDatabase, MockVenue, MockReview } from "@/lib/mockData";
import { toast } from "sonner";
import { HoldResult } from "@/types/booking";

export default function VenueDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const venueId = params.id as string;

  const [venue, setVenue] = useState<MockVenue | null>(null);
  const [reviews, setReviews] = useState<MockReview[]>([]);
  const [activeTab, setActiveTab] = useState<"turf" | "lights" | "amenities">("turf");
  
  // Booking states
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  
  // Review form states
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const dayAfterStr = new Date(Date.now() + 172800000).toISOString().slice(0, 10);

  useEffect(() => {
    const v = MockDatabase.getVenueById(venueId);
    if (v) {
      setVenue(v);
      setReviews(MockDatabase.getReviews(venueId));
    }
    setSelectedDate(todayStr);
  }, [venueId]);

  if (!venue) {
    return (
      <div className="p-8 text-center bg-[#0A0F2C] min-h-screen text-[#F5F3FF] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-muted font-heading uppercase text-sm">Venue not found or offline</p>
        <Link href="/venues" className="px-5 py-2.5 bg-[#00FF87] text-[#040a06] rounded-xl font-heading text-xs font-bold uppercase">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    MockDatabase.addReview(venueId, "Captain Guest", ratingInput, commentInput);
    
    // Refresh
    setVenue(MockDatabase.getVenueById(venueId) || null);
    setReviews(MockDatabase.getReviews(venueId));
    setCommentInput("");
    toast.success("Review posted successfully! Thank you for the feedback.");
  };

  const handleLockSlot = () => {
    if (!selectedSlot) {
      toast.error("Please select a time slot first.");
      return;
    }

    // Check if slot is already booked in database (simulation)
    const existingBookings = MockDatabase.getBookings();
    const isBooked = existingBookings.some(b => 
      b.targetId === venue.id && 
      b.slotDate === selectedDate && 
      b.slotTime === selectedSlot && 
      b.status === "CONFIRMED"
    );

    if (isBooked) {
      toast.error("This slot is already reserved by another Captain. Please select another time.");
      return;
    }

    // Generate HoldResult matching Supabase types
    const holdId = "hold_" + Math.random().toString(36).substr(2, 9);
    const hold: HoldResult = {
      reservation_id: holdId,
      pitch_id: venue.id,
      slot_start: `${selectedDate}T${selectedSlot}:00.000Z`,
      slot_end: `${selectedDate}T${parseInt(selectedSlot) + 2}:00.000Z`, // 2 hours blocks
      status: "PENDING_HOLD",
      hold_expires_at: new Date(Date.now() + 300000).toISOString(), // 5 minutes countdown
      booking_reference: "REF-" + Math.floor(100000 + Math.random() * 900000),
      amount_minor: venue.pricePerHour * 100 // minor units (cents)
    };

    // Save to local storage for the pre-existing checkout wizard
    window.localStorage.setItem("kahawa-current-hold", JSON.stringify(hold));
    
    // Create temporary hold inside MockDatabase bookings list
    const bookings = MockDatabase.getBookings();
    const newHold = {
      id: holdId,
      type: "venue" as const,
      targetId: venue.id,
      targetName: venue.name,
      targetImage: venue.image,
      slotDate: selectedDate,
      slotTime: selectedSlot,
      price: venue.pricePerHour,
      status: "PENDING_HOLD" as const,
      bookingRef: hold.booking_reference,
      createdAt: new Date().toISOString()
    };
    bookings.push(newHold);
    localStorage.setItem("ds_db_bookings", JSON.stringify(bookings));

    toast.success("Hold secured! You have exactly 5 minutes to complete M-Pesa payment.");
    router.push("/checkout");
  };

  const getGalleryImage = () => {
    if (activeTab === "turf") return venue.gallery[0] || venue.image;
    if (activeTab === "lights") return venue.gallery[1] || venue.image;
    return venue.gallery[2] || venue.image;
  };

  // Check booked slots for selectedDate
  const bookedSlots = MockDatabase.getBookings()
    .filter(b => b.targetId === venue.id && b.slotDate === selectedDate && b.status === "CONFIRMED")
    .map(b => b.slotTime);

  const formatCurrency = (minor: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(minor);
  };

  return (
    <div className="p-4 sm:p-8 bg-transparent min-h-screen text-[#F5F3FF] relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,135,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,135,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10 animate-fade-in text-left">
        
        {/* Back Link */}
        <Link
          href="/venues"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#121e15]/30 border border-white/5 text-xs font-bold font-heading uppercase tracking-wider text-gray-muted hover:text-white hover:border-[#00FF87]/20 transition active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Venues
        </Link>

        {/* Grid: Gallery + Details & Booking */}
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* Left Column: Gallery & Details (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Tabbed Image Showcase */}
            <div className="glass-panel rounded-3xl border-cyan-blue/15 overflow-hidden shadow-lg space-y-4 p-4">
              <div className="h-72 sm:h-96 w-full rounded-2xl overflow-hidden relative">
                <img 
                  src={getGalleryImage()} 
                  alt={venue.name}
                  className="w-full h-full object-cover transition-all duration-700" 
                />
                <div className="absolute bottom-4 left-4 bg-[#040a06]/90 border border-[#00FF87]/20 px-3 py-1.5 rounded-xl text-[#00FF87] text-[10px] font-heading font-extrabold uppercase tracking-widest">
                  {venue.category}Spec Spec
                </div>
              </div>

              {/* Gallery Tab Triggers */}
              <div className="flex gap-2 p-1 bg-[#040a06]/60 border border-white/5 rounded-xl select-none">
                <button
                  onClick={() => setActiveTab("turf")}
                  className={`flex-1 py-2 text-[10px] font-heading font-extrabold uppercase tracking-wider rounded-lg transition-all active:scale-95 ${
                    activeTab === "turf" ? "bg-[#00FF87] text-[#040a06]" : "text-gray-muted hover:text-white"
                  }`}
                >
                  Court Overview
                </button>
                <button
                  onClick={() => setActiveTab("lights")}
                  className={`flex-1 py-2 text-[10px] font-heading font-extrabold uppercase tracking-wider rounded-lg transition-all active:scale-95 ${
                    activeTab === "lights" ? "bg-[#00FF87] text-[#040a06]" : "text-gray-muted hover:text-white"
                  }`}
                >
                  Close-up view
                </button>
                <button
                  onClick={() => setActiveTab("amenities")}
                  className={`flex-1 py-2 text-[10px] font-heading font-extrabold uppercase tracking-wider rounded-lg transition-all active:scale-95 ${
                    activeTab === "amenities" ? "bg-[#00FF87] text-[#040a06]" : "text-gray-muted hover:text-white"
                  }`}
                >
                  Locker Rooms
                </button>
              </div>
            </div>

            {/* General Specs Details */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border-cyan-blue/15 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 border-b border-white/5 pb-5">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl uppercase tracking-wider text-white">
                    {venue.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-muted mt-1.5">
                    <MapPin className="h-4 w-4 text-[#60EFFF]" />
                    <span>{venue.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-[#040a06]/40 px-3 py-1.5 rounded-xl border border-white/10 self-start">
                  <Star className="h-4.5 w-4.5 fill-[#00FF87] text-[#00FF87]" />
                  <span className="font-heading text-sm font-black text-white">{venue.rating}</span>
                  <span className="text-[10px] text-gray-muted">({venue.reviewsCount} reviews)</span>
                </div>
              </div>

              {/* Core description */}
              <div className="space-y-3">
                <h4 className="font-heading text-xs uppercase tracking-widest text-[#00FF87]">Pitch Description</h4>
                <p className="text-xs sm:text-sm text-gray-muted leading-relaxed">
                  {venue.description}
                </p>
              </div>

              {/* Specific specifications */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                <div>
                  <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Dimensions</span>
                  <span className="font-heading text-xs sm:text-sm font-extrabold uppercase text-white mt-1 block">{venue.size}</span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Surface Type</span>
                  <span className="font-heading text-xs sm:text-sm font-extrabold uppercase text-white mt-1 block">{venue.type}</span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Indoor/Outdoor</span>
                  <span className="font-heading text-xs sm:text-sm font-extrabold uppercase text-white mt-1 block">{venue.indoor ? "Indoor Arena" : "Outdoor Complex"}</span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Security Check</span>
                  <span className="font-heading text-xs sm:text-sm font-extrabold uppercase text-[#00FF87] mt-1 block flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> Fully Secured
                  </span>
                </div>
              </div>

              {/* Amenities Grid */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                <h4 className="font-heading text-xs uppercase tracking-widest text-[#60EFFF]">Complex Amenities</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {venue.amenities.map((am, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl text-xs text-gray-muted font-heading font-semibold uppercase tracking-wider">
                      <Wifi className="h-4 w-4 text-[#60EFFF]" />
                      <span>{am}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Reviews Section */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border-cyan-blue/15 space-y-6">
              <h3 className="font-heading text-xl uppercase tracking-wider text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#60EFFF]" /> Reviews & Ratings
              </h3>

              {/* Review Input Box */}
              <form onSubmit={handleReviewSubmit} className="bg-[#040a06]/40 p-4 rounded-2xl border border-white/5 space-y-4">
                <h4 className="font-heading text-xs uppercase tracking-widest text-[#00FF87]">Post a Review</h4>
                <div className="flex gap-4 items-center">
                  <span className="text-[10px] uppercase text-gray-muted tracking-widest font-heading font-extrabold">Rating:</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRatingInput(star)}
                        className="transition active:scale-90"
                      >
                        <Star className={`h-5 w-5 ${ratingInput >= star ? "fill-[#00FF87] text-[#00FF87]" : "text-white/20"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Enter your experience (e.g. Clean turf, great lighting!)"
                    required
                    className="w-full bg-[#0A0F2C]/80 border border-cyan-blue/20 rounded-xl px-4 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#00FF87]/50"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#00FF87] text-[#040a06] rounded-xl font-heading font-extrabold text-xs uppercase tracking-widest transition active:scale-95 flex items-center gap-1 shadow-[0_0_12px_rgba(0,255,135,0.2)]"
                  >
                    Post <Send className="h-3 w-3" />
                  </button>
                </div>
              </form>

              {/* Reviews List */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {reviews.length === 0 ? (
                  <p className="text-xs text-gray-muted italic text-center py-4">No reviews posted yet for this court. Be the first!</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4 text-left">
                      <div className="h-10 w-10 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-white/10">
                        <img src={rev.userImage} alt={rev.userName} className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white font-heading uppercase">{rev.userName}</span>
                          <span className="text-[9px] text-gray-muted">{rev.date}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${rev.rating > i ? "fill-[#00FF87] text-[#00FF87]" : "text-white/10"}`} />
                          ))}
                        </div>
                        <p className="text-xs text-gray-muted leading-relaxed">
                          {rev.comment}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>

          {/* Right Column: Interactive Booking Widget (lg:col-span-4) */}
          <div className="lg:col-span-4 text-left">
            <div className="glass-panel p-5 sm:p-6 rounded-3xl border-cyan-blue/15 sticky top-6 space-y-6">
              
              <div className="space-y-1">
                <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Hourly Court Reservation</span>
                <span className="font-heading text-2xl font-black text-[#00FF87] text-glow-green">
                  {formatCurrency(venue.pricePerHour)}
                </span>
                <span className="text-[10px] text-gray-muted"> / hour</span>
              </div>

              <hr className="border-white/5" />

              {/* Date Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase text-gray-muted tracking-widest font-heading font-extrabold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#60EFFF]" /> 1. Select Date
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#040a06]/70 border border-white/5 rounded-xl p-1 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedDate(todayStr);
                      setSelectedSlot(null);
                    }}
                    className={`py-2 text-[9px] font-heading font-bold uppercase tracking-wider rounded-lg transition-all ${
                      selectedDate === todayStr ? "bg-[#00FF87] text-[#040a06]" : "text-gray-muted hover:text-white"
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
                      selectedDate === tomorrowStr ? "bg-[#00FF87] text-[#040a06]" : "text-gray-muted hover:text-white"
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
                      selectedDate === dayAfterStr ? "bg-[#00FF87] text-[#040a06]" : "text-gray-muted hover:text-white"
                    }`}
                  >
                    {new Date(dayAfterStr).toLocaleDateString(undefined, { weekday: "short" })}
                  </button>
                </div>
              </div>

              {/* Time Slots Grid */}
              <div className="space-y-3">
                <label className="block text-[10px] uppercase text-gray-muted tracking-widest font-heading font-extrabold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#00FF87]" /> 2. Available Slots (2-Hour Blocks)
                </label>

                <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {venue.slots.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = selectedSlot === slot;

                    return (
                      <button
                        key={slot}
                        onClick={() => !isBooked && setSelectedSlot(slot)}
                        disabled={isBooked}
                        className={`py-3 rounded-xl border text-xs font-bold font-heading tracking-wider uppercase transition-all duration-300 relative group active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                          isBooked
                            ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed"
                            : isSelected
                            ? "bg-[#00FF87]/15 border-[#00FF87] text-[#00FF87] shadow-[0_0_10px_rgba(0,255,135,0.15)]"
                            : "bg-[#121e15]/20 border-[#00FF87]/10 text-gray-muted hover:text-white hover:border-[#00FF87]/30"
                        }`}
                      >
                        <span className={isBooked ? "line-through text-white/20" : ""}>{slot}</span>
                        <span className="text-[7px] uppercase tracking-wider font-semibold opacity-75 mt-0.5">
                          {isBooked ? "Fully Booked" : isSelected ? "Selected" : "Open Slot"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hold Action and Summary */}
              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="bg-[#040a06]/40 p-3 rounded-xl border border-white/5 space-y-1.5 text-xs text-gray-muted">
                  <div className="flex justify-between">
                    <span>Court Booking Hold:</span>
                    <span>5 Minutes Limit</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Gateway:</span>
                    <span className="text-[#00FF87] flex items-center gap-0.5"><CircleCheck className="h-3 w-3" /> M-Pesa Pop-up</span>
                  </div>
                </div>

                <button
                  onClick={handleLockSlot}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#00FF87] hover:bg-[#00FF87]/90 text-[#040a06] font-heading font-black text-xs uppercase tracking-widest transition duration-300 active:scale-95 shadow-[0_0_20px_rgba(0,255,135,0.25)] flex items-center justify-center gap-2"
                >
                  <Zap className="h-4 w-4 fill-current text-glow-green" />
                  Lock Slot & Pay
                </button>
                <p className="text-[8px] text-gray-muted text-center italic">
                  * Tapping Lock Slot holds the court exclusively for exactly 5 minutes while you checkout.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
