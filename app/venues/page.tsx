"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Star, 
  ChevronRight, 
  ShieldCheck,
  Compass,
  Trophy,
  Filter,
  Check
} from "lucide-react";
import { MockDatabase, MockVenue } from "@/lib/mockData";

export default function VenuesListingPage() {
  const [allVenues, setAllVenues] = useState<MockVenue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<MockVenue[]>([]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSize, setSelectedSize] = useState<string>("All");
  const [priceRange, setPriceRange] = useState<number>(4000);
  const [indoorOnly, setIndoorOnly] = useState<boolean | null>(null);
  
  // Map interactive state
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Read from MockDatabase
    const venues = MockDatabase.getVenues();
    setAllVenues(venues);
    setFilteredVenues(venues);
  }, []);

  // Filter logic
  useEffect(() => {
    let result = allVenues;

    if (searchQuery) {
      result = result.filter(v => 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        v.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter(v => v.category === selectedCategory);
    }

    if (selectedSize !== "All") {
      result = result.filter(v => v.size === selectedSize);
    }

    if (priceRange) {
      result = result.filter(v => v.pricePerHour <= priceRange);
    }

    if (indoorOnly !== null) {
      result = result.filter(v => v.indoor === indoorOnly);
    }

    if (selectedZone) {
      if (selectedZone === "Zone A") {
        result = result.filter(v => v.id === "v1" || v.id === "v2");
      } else if (selectedZone === "Zone B") {
        result = result.filter(v => v.id === "v4" || v.id === "v6");
      } else if (selectedZone === "Zone C") {
        result = result.filter(v => v.id === "v5");
      } else if (selectedZone === "Zone D") {
        result = result.filter(v => v.id === "v3");
      }
    }

    setFilteredVenues(result);
  }, [searchQuery, selectedCategory, selectedSize, priceRange, indoorOnly, selectedZone, allVenues]);

  const categories = ["All", "Football", "Basketball", "Tennis", "Padel", "Volleyball"];
  const sizes = ["All", "11-a-side", "5-a-side", "Double Court", "Singles/Doubles", "Full Professional FIBA"];

  const formatCurrency = (minor: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(minor);
  };

  const handleZoneClick = (zone: string) => {
    if (selectedZone === zone) {
      setSelectedZone(null); // Deselect
    } else {
      setSelectedZone(zone);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-transparent min-h-screen text-[#F5F3FF] relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,135,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,135,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10 animate-fade-in">
        
        {/* Banner Header */}
        <header className="rounded-2xl glass-panel-glow p-6 sm:p-8 border border-[#00FF87]/15 relative overflow-hidden text-left shadow-lg">
          <div className="absolute top-[-20%] right-[-10%] h-48 w-48 rounded-full bg-[#00FF87] opacity-[0.03] blur-[60px] pointer-events-none" />
          <span className="font-heading text-xs uppercase tracking-[0.25em] text-[#60EFFF] text-glow-cyan">Marketplace Directory</span>
          <h1 className="mt-2 font-heading text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
            EXPLORE VENUES
          </h1>
          <p className="mt-3 max-w-2xl text-xs sm:text-sm text-gray-muted leading-relaxed">
            Select premium specs, search prices, and lock in slot holds immediately. Tapping coordinates on our Stadium Map filters courts automatically.
          </p>
        </header>

        {/* Categories Selector */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none select-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedZone(null); // Clear map filter for clean category switches
              }}
              className={`px-5 py-2.5 rounded-xl font-heading text-xs font-extrabold uppercase tracking-widest transition-all duration-300 shrink-0 border active:scale-95 ${
                selectedCategory === cat
                  ? "bg-[#00FF87] text-[#040a06] border-[#00FF87] shadow-[0_0_12px_rgba(0,255,135,0.25)]"
                  : "bg-[#121e15]/40 text-gray-muted border-[#00FF87]/10 hover:text-white hover:border-[#00FF87]/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search, Filter Bar and SVG Map Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* Left Column: Search & Filters (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search Input and Filter Trigger */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search complexes by name, region or spec..."
                  className="w-full bg-[#121e15]/30 border border-white/5 focus:border-[#00FF87]/40 outline-none rounded-xl py-3 pl-11 pr-4 text-xs sm:text-sm text-white transition-all duration-300"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl border font-heading text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 ${
                  showFilters 
                    ? "bg-[#00FF87]/15 border-[#00FF87]/30 text-[#00FF87]" 
                    : "bg-[#121e15]/30 border-white/5 text-gray-muted hover:text-white"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
              </button>
            </div>

            {/* Expandable Advanced Filters Box */}
            {showFilters && (
              <div className="glass-panel p-5 rounded-2xl border-[#00FF87]/15 grid gap-6 md:grid-cols-3 text-left animate-fade-in">
                {/* Price Filter */}
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase text-gray-muted tracking-widest font-heading font-extrabold">
                    Max Price Per Hour: <span className="text-[#00FF87]">KES {priceRange}</span>
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="5000"
                    step="200"
                    value={priceRange}
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00FF87]"
                  />
                  <div className="flex justify-between text-[8px] text-gray-muted font-heading uppercase tracking-widest">
                    <span>KES 1k</span>
                    <span>KES 5k</span>
                  </div>
                </div>

                {/* Pitch Sizes Filter */}
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase text-gray-muted tracking-widest font-heading font-extrabold">
                    Field Size Dimensions
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full bg-[#040a06]/85 border border-[#00FF87]/25 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00FF87]/50"
                  >
                    {sizes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Indoor/Outdoor Filter */}
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase text-gray-muted tracking-widest font-heading font-extrabold">
                    Environment Layout
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-[#040a06]/85 border border-[#00FF87]/20 rounded-xl p-1 shrink-0">
                    <button
                      onClick={() => setIndoorOnly(null)}
                      className={`py-1 text-[9px] font-heading font-bold uppercase tracking-wider rounded-lg transition-all ${
                        indoorOnly === null ? "bg-[#00FF87] text-[#040a06]" : "text-gray-muted hover:text-white"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setIndoorOnly(true)}
                      className={`py-1 text-[9px] font-heading font-bold uppercase tracking-wider rounded-lg transition-all ${
                        indoorOnly === true ? "bg-[#00FF87] text-[#040a06]" : "text-gray-muted hover:text-white"
                      }`}
                    >
                      Indoor
                    </button>
                    <button
                      onClick={() => setIndoorOnly(false)}
                      className={`py-1 text-[9px] font-heading font-bold uppercase tracking-wider rounded-lg transition-all ${
                        indoorOnly === false ? "bg-[#00FF87] text-[#040a06]" : "text-gray-muted hover:text-white"
                      }`}
                    >
                      Outdoor
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Venues Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {filteredVenues.length === 0 ? (
                <div className="md:col-span-2 glass-panel p-10 rounded-2xl border-white/5 text-center space-y-4">
                  <SlidersHorizontal className="h-10 w-10 text-gray-muted mx-auto animate-pulse" />
                  <h3 className="font-heading text-lg uppercase text-white font-bold">No courts match filters</h3>
                  <p className="text-xs text-gray-muted max-w-sm mx-auto">
                    Try relaxing your search query or selecting a different category from the dashboard menu.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                      setSelectedSize("All");
                      setPriceRange(4000);
                      setIndoorOnly(null);
                      setSelectedZone(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#00FF87] text-[#040a06] font-heading font-extrabold text-[10px] uppercase tracking-wider"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                filteredVenues.map((venue) => (
                  <div
                    key={venue.id}
                    className="glass-panel rounded-2xl border-cyan-blue/10 overflow-hidden flex flex-col justify-between glass-card-hover group shadow-lg"
                  >
                    <div>
                      {/* Image Frame */}
                      <div className="h-44 w-full overflow-hidden relative">
                        <img 
                          src={venue.image} 
                          alt={venue.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute top-3 left-3 bg-[#040a06]/90 border border-[#00FF87]/20 px-2 py-0.5 rounded-lg text-[#00FF87] text-[9px] font-heading font-extrabold uppercase tracking-widest">
                          {venue.category}
                        </div>
                        <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-lg text-[9px] font-heading font-bold uppercase tracking-wider ${
                          venue.status === "Available"
                            ? "bg-green-600/20 border border-green-500/30 text-green-400"
                            : venue.status === "Maintenance"
                            ? "bg-yellow-600/20 border border-yellow-500/30 text-yellow-400"
                            : "bg-red-600/20 border border-red-500/30 text-red-400"
                        }`}>
                          {venue.status}
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="p-4 text-left space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-heading text-base uppercase tracking-wide text-white group-hover:text-[#00FF87] transition leading-tight">
                            {venue.name}
                          </h3>
                          <div className="bg-[#040a06]/40 px-1.5 py-0.5 rounded text-white text-[10px] font-heading font-bold flex items-center gap-0.5 shrink-0 ml-2">
                            <Star className="h-3 w-3 fill-[#00FF87] text-[#00FF87]" /> {venue.rating}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-gray-muted text-[10px] font-heading uppercase tracking-wide">
                          <MapPin className="h-3 w-3 text-[#60EFFF]" />
                          <span>{venue.location.split(",")[0]}</span>
                          <span className="h-1 w-1 bg-white/20 rounded-full" />
                          <span>{venue.indoor ? "Indoor" : "Outdoor"}</span>
                          <span className="h-1 w-1 bg-white/20 rounded-full" />
                          <span>{venue.size}</span>
                        </div>
                        
                        <p className="text-[10px] text-gray-muted leading-relaxed line-clamp-2">
                          {venue.description}
                        </p>
                      </div>
                    </div>

                    {/* Rate and Button footer */}
                    <div className="px-4 pb-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-left">
                      <div>
                        <span className="block text-[8px] uppercase tracking-widest text-gray-muted leading-none">Hourly rate</span>
                        <span className="font-heading text-sm font-black text-[#00FF87] text-glow-green tracking-tight mt-1.5 block">
                          {formatCurrency(venue.pricePerHour)}
                        </span>
                      </div>
                      <Link
                        href={`/venues/${venue.id}`}
                        className={`px-3 py-2 rounded-xl text-[9px] font-heading font-bold uppercase tracking-widest transition active:scale-95 flex items-center gap-1 ${
                          venue.status === "Maintenance"
                            ? "bg-white/5 border border-white/10 text-gray-muted cursor-not-allowed"
                            : "bg-white/5 hover:bg-[#00FF87] text-white hover:text-[#040a06] shadow-sm"
                        }`}
                      >
                        Book Slot
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* Right Column: Stadium Coordinates Map representation (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6 text-left">
            <div className="glass-panel p-5 rounded-2xl border-cyan-blue/15 flex flex-col h-full justify-between">
              
              <div className="space-y-2 mb-4">
                <span className="inline-flex items-center gap-1 text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#00FF87]">
                  <Compass className="h-3.5 w-3.5 text-glow-green" /> Stadium Complex Coordinates
                </span>
                <h3 className="font-heading text-lg uppercase tracking-wider text-white">Interactive Complex Grid</h3>
                <p className="text-[10px] text-gray-muted leading-relaxed">
                  Tapping coordinates isolates active pitches in specific stadium zones. Grey courts represent fields under maintenance.
                </p>
              </div>

              {/* Interactive Vector Map SVG Grid */}
              <div className="bg-[#040a06]/60 border border-[#00FF87]/10 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden">
                <svg viewBox="0 0 200 200" className="w-full max-w-[240px] aspect-square">
                  {/* Grid Lines */}
                  <line x1="0" y1="50" x2="200" y2="50" stroke="rgba(0,255,135,0.04)" strokeWidth="1" />
                  <line x1="0" y1="100" x2="200" y2="100" stroke="rgba(0,255,135,0.04)" strokeWidth="1" />
                  <line x1="0" y1="150" x2="200" y2="150" stroke="rgba(0,255,135,0.04)" strokeWidth="1" />
                  <line x1="50" y1="0" x2="50" y2="200" stroke="rgba(0,255,135,0.04)" strokeWidth="1" />
                  <line x1="100" y1="0" x2="100" y2="200" stroke="rgba(0,255,135,0.04)" strokeWidth="1" />
                  <line x1="150" y1="0" x2="150" y2="200" stroke="rgba(0,255,135,0.04)" strokeWidth="1" />

                  {/* Zone A: Riverside Grand & Cage (Top-Left) */}
                  <g 
                    onClick={() => handleZoneClick("Zone A")}
                    className="cursor-pointer group/zone select-none"
                  >
                    <rect 
                      x="10" y="10" width="80" height="80" rx="8"
                      className={`transition-all duration-300 ${
                        selectedZone === "Zone A" 
                          ? "fill-[#00FF87]/20 stroke-[#00FF87] stroke-2" 
                          : "fill-transparent stroke-[#00FF87]/20 group-hover/zone:stroke-[#00FF87]/50"
                      }`}
                    />
                    <text 
                      x="50" y="45" textAnchor="middle" 
                      className={`font-heading font-black text-xs uppercase transition-colors duration-300 ${
                        selectedZone === "Zone A" ? "fill-[#00FF87] text-glow-green" : "fill-white/40"
                      }`}
                    >
                      ZONE A
                    </text>
                    <text x="50" y="60" textAnchor="middle" className="fill-gray-muted text-[8px] tracking-wider uppercase">Riverside</text>
                  </g>

                  {/* Zone B: Garden Tennis & Skyline (Top-Right) */}
                  <g 
                    onClick={() => handleZoneClick("Zone B")}
                    className="cursor-pointer group/zone select-none"
                  >
                    <rect 
                      x="110" y="10" width="80" height="80" rx="8"
                      className={`transition-all duration-300 ${
                        selectedZone === "Zone B" 
                          ? "fill-[#00FF87]/15 stroke-yellow-500/80 stroke-2" 
                          : "fill-transparent stroke-[#60EFFF]/20 group-hover/zone:stroke-[#60EFFF]/50"
                      }`}
                    />
                    <text 
                      x="150" y="45" textAnchor="middle" 
                      className={`font-heading font-black text-xs uppercase transition-colors duration-300 ${
                        selectedZone === "Zone B" ? "fill-yellow-500" : "fill-white/40"
                      }`}
                    >
                      ZONE B
                    </text>
                    <text x="150" y="60" textAnchor="middle" className="fill-gray-muted text-[8px] tracking-wider uppercase">Tennis/Volley</text>
                  </g>

                  {/* Zone C: Vanguard Basket (Bottom-Left) */}
                  <g 
                    onClick={() => handleZoneClick("Zone C")}
                    className="cursor-pointer group/zone select-none"
                  >
                    <rect 
                      x="10" y="110" width="80" height="80" rx="8"
                      className={`transition-all duration-300 ${
                        selectedZone === "Zone C" 
                          ? "fill-[#60EFFF]/20 stroke-[#60EFFF] stroke-2" 
                          : "fill-transparent stroke-[#60EFFF]/20 group-hover/zone:stroke-[#60EFFF]/50"
                      }`}
                    />
                    <text 
                      x="50" y="145" textAnchor="middle" 
                      className={`font-heading font-black text-xs uppercase transition-colors duration-300 ${
                        selectedZone === "Zone C" ? "fill-[#60EFFF] text-glow-cyan" : "fill-white/40"
                      }`}
                    >
                      ZONE C
                    </text>
                    <text x="50" y="160" textAnchor="middle" className="fill-gray-muted text-[8px] tracking-wider uppercase">Basketball</text>
                  </g>

                  {/* Zone D: Westlands Rooftop Padel (Bottom-Right) */}
                  <g 
                    onClick={() => handleZoneClick("Zone D")}
                    className="cursor-pointer group/zone select-none"
                  >
                    <rect 
                      x="110" y="110" width="80" height="80" rx="8"
                      className={`transition-all duration-300 ${
                        selectedZone === "Zone D" 
                          ? "fill-[#00FF87]/20 stroke-[#00FF87] stroke-2" 
                          : "fill-transparent stroke-[#00FF87]/20 group-hover/zone:stroke-[#00FF87]/50"
                      }`}
                    />
                    <text 
                      x="150" y="145" textAnchor="middle" 
                      className={`font-heading font-black text-xs uppercase transition-colors duration-300 ${
                        selectedZone === "Zone D" ? "fill-[#00FF87] text-glow-green" : "fill-white/40"
                      }`}
                    >
                      ZONE D
                    </text>
                    <text x="150" y="160" textAnchor="middle" className="fill-gray-muted text-[8px] tracking-wider uppercase">Padel Dome</text>
                  </g>
                </svg>
              </div>

              {/* Reset Map Filter */}
              <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                {selectedZone ? (
                  <div className="flex justify-between items-center bg-[#040a06]/40 p-2.5 rounded-xl border border-[#00FF87]/10 animate-fade-in">
                    <span className="text-[10px] text-gray-muted uppercase tracking-wider font-heading">
                      Active: <strong className="text-[#00FF87]">{selectedZone}</strong>
                    </span>
                    <button 
                      onClick={() => setSelectedZone(null)}
                      className="text-[9px] text-red-400 hover:text-red-500 font-heading uppercase font-bold tracking-wider"
                    >
                      Clear Map
                    </button>
                  </div>
                ) : (
                  <p className="text-[9px] text-gray-muted italic text-center">
                    Tap a stadium zone rectangle to filter courts visually.
                  </p>
                )}
                
                {/* Stats recap */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">
                    <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Total courts</span>
                    <span className="font-heading text-sm font-bold text-white mt-0.5 block">{allVenues.length}</span>
                  </div>
                  <div className="bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">
                    <span className="block text-[8px] uppercase tracking-widest text-gray-muted">Matches Available</span>
                    <span className="font-heading text-sm font-bold text-[#00FF87] mt-0.5 block">
                      {allVenues.filter(v => v.status === "Available").length}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
