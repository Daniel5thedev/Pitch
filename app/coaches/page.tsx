"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  SlidersHorizontal, 
  Star, 
  Award, 
  Clock, 
  ChevronRight, 
  GraduationCap,
  Sparkles,
  Zap
} from "lucide-react";
import { MockDatabase, MockCoach } from "@/lib/mockData";

export default function CoachesListingPage() {
  const [allCoaches, setAllCoaches] = useState<MockCoach[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<MockCoach[]>([]);
  
  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [priceMax, setPriceMax] = useState<number>(2500);

  useEffect(() => {
    const coaches = MockDatabase.getCoaches();
    setAllCoaches(coaches);
    setFilteredCoaches(coaches);
  }, []);

  useEffect(() => {
    let result = allCoaches;

    if (searchQuery) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.bio.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedSpecialty !== "All") {
      result = result.filter(c => c.specialty === selectedSpecialty);
    }

    if (priceMax) {
      result = result.filter(c => c.pricePerHour <= priceMax);
    }

    setFilteredCoaches(result);
  }, [searchQuery, selectedSpecialty, priceMax, allCoaches]);

  const specialties = ["All", "Tactics", "Conditioning", "Shooting", "Goalkeeping"];

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
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10 animate-fade-in">
        
        {/* Banner Header */}
        <header className="rounded-2xl glass-panel-glow p-6 sm:p-8 border border-[#00FF87]/15 relative overflow-hidden text-left shadow-lg">
          <div className="absolute top-[-20%] right-[-10%] h-48 w-48 rounded-full bg-[#00FF87] opacity-[0.03] blur-[60px] pointer-events-none" />
          <span className="font-heading text-xs uppercase tracking-[0.25em] text-[#60EFFF] text-glow-cyan">Private Training Directory</span>
          <h1 className="mt-2 font-heading text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
            ACADEMY COACHES
          </h1>
          <p className="mt-3 max-w-2xl text-xs sm:text-sm text-gray-muted leading-relaxed">
            Schedule 1-on-1 private training classes with certified professional coaches. Perfect your tactical spaces, striker power, or reflex saves instantly.
          </p>
        </header>

        {/* Filters and Specialty Selector */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none select-none">
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-5 py-2.5 rounded-xl font-heading text-xs font-extrabold uppercase tracking-widest transition-all duration-300 shrink-0 border active:scale-95 ${
                selectedSpecialty === spec
                  ? "bg-[#60EFFF] text-[#040a06] border-[#60EFFF] shadow-[0_0_12px_rgba(96,239,255,0.25)]"
                  : "bg-[#121e15]/40 text-gray-muted border-[#60EFFF]/10 hover:text-white hover:border-[#60EFFF]/30"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* Search and Filters grid */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coach names, licenses or biography details..."
                className="w-full bg-[#121e15]/30 border border-white/5 focus:border-[#60EFFF]/40 outline-none rounded-xl py-3 pl-11 pr-4 text-xs sm:text-sm text-white transition-all duration-300"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border font-heading text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 ${
                showFilters 
                  ? "bg-[#60EFFF]/15 border-[#60EFFF]/30 text-[#60EFFF]" 
                  : "bg-[#121e15]/30 border-white/5 text-gray-muted hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="glass-panel p-5 rounded-2xl border-[#60EFFF]/15 text-left max-w-md animate-fade-in">
              <div className="space-y-2">
                <label className="block text-[10px] uppercase text-gray-muted tracking-widest font-heading font-extrabold">
                  Max Hourly Training Rate: <span className="text-[#60EFFF]">KES {priceMax}</span>
                </label>
                <input
                  type="range"
                  min="1200"
                  max="2500"
                  step="100"
                  value={priceMax}
                  onChange={(e) => setPriceMax(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#60EFFF]"
                />
                <div className="flex justify-between text-[8px] text-gray-muted font-heading uppercase tracking-widest">
                  <span>KES 1.2k</span>
                  <span>KES 2.5k</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coaches Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {filteredCoaches.length === 0 ? (
            <div className="md:col-span-2 glass-panel p-10 rounded-2xl border-white/5 text-center space-y-4">
              <SlidersHorizontal className="h-10 w-10 text-gray-muted mx-auto animate-pulse" />
              <h3 className="font-heading text-lg uppercase text-white font-bold">No certified trainers match filters</h3>
              <p className="text-xs text-gray-muted max-w-sm mx-auto">
                Try expanding your search parameters or selecting all specialty filters from the chips menu.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSpecialty("All");
                  setPriceMax(2500);
                }}
                className="px-4 py-2 rounded-xl bg-[#60EFFF] text-[#040a06] font-heading font-extrabold text-[10px] uppercase tracking-wider"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredCoaches.map((coach) => (
              <div 
                key={coach.id}
                className="glass-panel rounded-2xl border-cyan-blue/10 overflow-hidden flex flex-col sm:flex-row justify-between glass-card-hover group shadow-lg text-left"
              >
                {/* Profile Image Column */}
                <div className="sm:w-48 h-48 sm:h-full relative overflow-hidden shrink-0">
                  <img 
                    src={coach.image} 
                    alt={coach.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3 bg-[#040a06]/85 border border-[#60EFFF]/20 px-2 py-0.5 rounded-lg text-[#60EFFF] text-[9px] font-heading font-extrabold uppercase tracking-widest">
                    {coach.specialty}
                  </div>
                </div>

                {/* Details Column */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-heading text-lg uppercase tracking-wide text-white group-hover:text-[#60EFFF] transition leading-tight">
                          {coach.name}
                        </h3>
                        <span className="block text-[9px] uppercase tracking-widest text-[#00FF87] mt-0.5 font-heading font-semibold">
                          Experience: {coach.experience}
                        </span>
                      </div>
                      
                      <div className="bg-[#040a06]/40 px-1.5 py-0.5 rounded text-white text-[10px] font-heading font-bold flex items-center gap-0.5 shrink-0">
                        <Star className="h-3 w-3 fill-[#00FF87] text-[#00FF87]" /> {coach.rating}
                      </div>
                    </div>

                    {/* Certifications badges */}
                    <div className="flex flex-wrap gap-1">
                      {coach.certifications.slice(0, 2).map((cert, idx) => (
                        <span key={idx} className="text-[8px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-gray-muted uppercase tracking-wider font-heading font-medium">
                          {cert}
                        </span>
                      ))}
                    </div>

                    <p className="text-[10px] text-gray-muted leading-relaxed line-clamp-2">
                      {coach.bio}
                    </p>
                  </div>

                  {/* Pricing and Action Footer */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest text-gray-muted leading-none">Session Rate</span>
                      <span className="font-heading text-sm font-black text-[#60EFFF] text-glow-cyan tracking-tight mt-1.5 block">
                        {formatCurrency(coach.pricePerHour)}
                      </span>
                    </div>
                    <Link
                      href={`/coaches/${coach.id}`}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-[#60EFFF] text-white hover:text-[#040a06] text-[9px] font-heading font-bold uppercase tracking-widest transition active:scale-95 flex items-center gap-1 shadow-sm"
                    >
                      Book Class
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
