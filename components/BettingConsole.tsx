"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { LiveMatchTracker3D } from "./LiveMatchTracker3D";
import { Trophy, Coins, TrendingUp, Receipt, Play, Clock, ChevronRight, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  scoreHome: number;
  scoreAway: number;
  timer: number;
  phase: "ATTACK_HOME" | "ATTACK_AWAY" | "MIDFIELD" | "GOAL_SCORING" | "CORNER" | "KICKOFF";
  currentEvent: string;
  status: "LIVE" | "UPCOMING" | "FINISHED";
  countdown: number; // in seconds for UPCOMING
  history: string[];
  goals: { scorer: string; team: "home" | "away"; time: number }[];
  odds: {
    home: number;
    draw: number;
    away: number;
    over25: number;
    under25: number;
    bttsYes: number;
    bttsNo: number;
  };
}

interface Bet {
  id: string;
  matchId: string;
  matchName: string;
  marketName: string;
  prediction: "HOME" | "DRAW" | "AWAY" | "OVER25" | "UNDER25" | "BTTS_YES" | "BTTS_NO";
  predictionLabel: string;
  odds: number;
  stake: number;
  potentialPayout: number;
  status: "LIVE" | "WON" | "LOST";
  createdAt: string;
}

interface WalletTx {
  id: string;
  amount_minor: number;
  type: "TOPUP" | "PAYMENT" | "REFUND";
  description: string;
  created_at: string;
}

interface BettingConsoleProps {
  currentUserId?: string;
  walletBalance: number;
  formatCurrency: (minor: number) => string;
  onWalletUpdate?: (newBalance: number, tx?: WalletTx) => void;
}

export function BettingConsole({ currentUserId, walletBalance, formatCurrency, onWalletUpdate }: BettingConsoleProps) {
  const [activeTab, setActiveTab] = useState<"live" | "bets">("live");
  
  // Live simulated matches state
  const [matches, setMatches] = useState<Match[]>([
    {
      id: "m-1",
      homeTeam: "Riverside Rovers",
      awayTeam: "Kilimani Kings",
      scoreHome: 0,
      scoreAway: 0,
      timer: 0,
      phase: "KICKOFF",
      currentEvent: "Match Kickoff!",
      status: "LIVE",
      countdown: 0,
      history: ["Kickoff! Welcome to Riverside Stadium."],
      goals: [],
      odds: { home: 1.95, draw: 3.20, away: 3.60, over25: 1.80, under25: 1.90, bttsYes: 1.70, bttsNo: 2.05 }
    },
    {
      id: "m-2",
      homeTeam: "Kahawa United",
      awayTeam: "Arena Stars",
      scoreHome: 1,
      scoreAway: 0,
      timer: 18,
      phase: "MIDFIELD",
      currentEvent: "Midfield battle intensifying",
      status: "LIVE",
      countdown: 0,
      history: ["Goal! Kahawa United leads early via a header.", "Match Kickoff!"],
      goals: [{ scorer: "Omondi", team: "home", time: 8 }],
      odds: { home: 1.45, draw: 4.10, away: 6.50, over25: 1.65, under25: 2.10, bttsYes: 1.95, bttsNo: 1.75 }
    },
    {
      id: "m-3",
      homeTeam: "M-Pesa Dynamos",
      awayTeam: "Arena Rangers",
      scoreHome: 0,
      scoreAway: 0,
      timer: 0,
      phase: "MIDFIELD",
      currentEvent: "Match starting soon...",
      status: "UPCOMING",
      countdown: 10,
      history: [],
      goals: [],
      odds: { home: 2.30, draw: 3.05, away: 2.85, over25: 1.95, under25: 1.75, bttsYes: 1.80, bttsNo: 1.90 }
    }
  ]);

  const [selectedMatchId, setSelectedMatchId] = useState<string>("m-1");
  const [selectedBet, setSelectedBet] = useState<{
    matchId: string;
    market: keyof Match["odds"];
    prediction: Bet["prediction"];
    odds: number;
    label: string;
  } | null>(null);

  const [stakeInput, setStakeInput] = useState<string>("200");
  const [placedBets, setPlacedBets] = useState<Bet[]>([]);
  const [isSubmitting, startSubmitting] = useTransition();

  const activeMatch = matches.find(m => m.id === selectedMatchId) || matches[0];

  // Fast forward match simulators (60 seconds game loops)
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches(prevMatches => {
        return prevMatches.map(m => {
          if (m.status === "UPCOMING") {
            if (m.countdown <= 1) {
              return {
                ...m,
                status: "LIVE",
                timer: 0,
                phase: "KICKOFF",
                currentEvent: "Match Kickoff!",
                countdown: 0,
                history: ["Kickoff! Match is live."]
              };
            }
            return { ...m, countdown: m.countdown - 1 };
          }

          if (m.status === "FINISHED") {
            // Restart match simulation after 15 seconds
            if (m.countdown >= 15) {
              const baseOdds = [
                { home: 1.8, draw: 3.2, away: 3.8 },
                { home: 2.2, draw: 3.0, away: 2.9 },
                { home: 2.6, draw: 3.1, away: 2.4 }
              ][Math.floor(Math.random() * 3)];
              
              return {
                ...m,
                scoreHome: 0,
                scoreAway: 0,
                timer: 0,
                phase: "KICKOFF",
                currentEvent: "Match Kickoff!",
                status: "LIVE",
                countdown: 0,
                history: ["Kickoff! Welcome back to another live simulation."],
                goals: [],
                odds: {
                  ...baseOdds,
                  over25: +(1.6 + Math.random() * 0.5).toFixed(2),
                  under25: +(1.6 + Math.random() * 0.5).toFixed(2),
                  bttsYes: +(1.6 + Math.random() * 0.4).toFixed(2),
                  bttsNo: +(1.7 + Math.random() * 0.4).toFixed(2),
                }
              };
            }
            return { ...m, countdown: m.countdown + 1 };
          }

          // Process Live Match Engine increment
          const nextTimer = m.timer + 3; // simulated 3 mins per tick (30 ticks total = 90 mins)
          
          if (nextTimer >= 90) {
            // Resolve bets for this match!
            resolveBets(m.id, m.scoreHome, m.scoreAway);

            return {
              ...m,
              timer: 90,
              status: "FINISHED",
              countdown: 0, // used as restart timer
              currentEvent: "Full Time! Match Ended.",
              history: [`Full Time! final score: ${m.scoreHome} - ${m.scoreAway}`, ...m.history]
            };
          }

          // Probabilistic simulation of match states
          const phases: Match["phase"][] = ["MIDFIELD", "MIDFIELD", "ATTACK_HOME", "ATTACK_AWAY", "CORNER", "GOAL_SCORING"];
          const nextPhase = phases[Math.floor(Math.random() * phases.length)];
          
          let nextScoreHome = m.scoreHome;
          let nextScoreAway = m.scoreAway;
          let eventMessage = m.currentEvent;
          let nextHistory = [...m.history];
          let nextGoals = [...m.goals];

          const homeAttackMsgs = [
            "Home side moving forward rapidly",
            "Dangerous cross sent into the penalty box!",
            "Great long-ball pass into the right flank!"
          ];
          const awayAttackMsgs = [
            "Away team breaking on a swift counter-attack!",
            "Shot blocked by the home captain!",
            "Pressuring forward pass splits the defense"
          ];

          if (nextPhase === "MIDFIELD") {
            eventMessage = "Intense midfield duel for ball possession";
          } else if (nextPhase === "ATTACK_HOME") {
            eventMessage = homeAttackMsgs[Math.floor(Math.random() * homeAttackMsgs.length)];
          } else if (nextPhase === "ATTACK_AWAY") {
            eventMessage = awayAttackMsgs[Math.floor(Math.random() * awayAttackMsgs.length)];
          } else if (nextPhase === "CORNER") {
            eventMessage = `Corner kick awarded to ${Math.random() > 0.5 ? m.homeTeam : m.awayTeam}!`;
          } else if (nextPhase === "GOAL_SCORING") {
            const isHomeScoring = Math.random() > 0.5;
            // 25% chance a goal scoring opportunity actually converts into a goal
            const goalConverts = Math.random() < 0.28;

            if (goalConverts) {
              const scorerName = isHomeScoring 
                ? ["Kamau", "Oduor", "Wanjala", "Kiprop"][Math.floor(Math.random() * 4)]
                : ["Smith", "Rono", "Malkia", "Nandi"][Math.floor(Math.random() * 4)];

              if (isHomeScoring) {
                nextScoreHome += 1;
                eventMessage = `GOAL!!! ${m.homeTeam} scores via ${scorerName}!`;
              } else {
                nextScoreAway += 1;
                eventMessage = `GOAL!!! ${m.awayTeam} scores via ${scorerName}!`;
              }
              
              nextGoals.push({ scorer: scorerName, team: isHomeScoring ? "home" : "away", time: nextTimer });
              nextHistory.unshift(`${nextTimer}' - Goal! ${isHomeScoring ? m.homeTeam : m.awayTeam} scores: ${scorerName}`);
            } else {
              eventMessage = `Shot fired! Deflected by the goalkeeper's amazing reflexes!`;
            }
          }

          // Dynamic odds adjustment as game progresses
          const updatedOdds = { ...m.odds };
          const progress = nextTimer / 90;
          
          // Draw odds slowly increase as time ticks down
          updatedOdds.draw = +(3.0 + progress * 2.5).toFixed(2);
          
          if (nextScoreHome > nextScoreAway) {
            updatedOdds.home = +(1.05 + (1 - progress) * 0.4).toFixed(2);
            updatedOdds.away = +(3.0 + progress * 8.0).toFixed(2);
          } else if (nextScoreAway > nextScoreHome) {
            updatedOdds.away = +(1.05 + (1 - progress) * 0.4).toFixed(2);
            updatedOdds.home = +(3.0 + progress * 8.0).toFixed(2);
          } else {
            updatedOdds.home = +(2.0 + progress * 2.0).toFixed(2);
            updatedOdds.away = +(2.0 + progress * 2.0).toFixed(2);
          }

          return {
            ...m,
            timer: nextTimer,
            phase: nextPhase,
            scoreHome: nextScoreHome,
            scoreAway: nextScoreAway,
            currentEvent: eventMessage,
            history: nextHistory,
            goals: nextGoals,
            odds: updatedOdds
          };
        });
      });
    }, 2000); // Fast ticks for accelerated simulation

    return () => clearInterval(interval);
  }, []);

  // Bet Resolution Logic
  const resolveBets = (matchId: string, finalScoreHome: number, finalScoreAway: number) => {
    setPlacedBets(currBets => {
      return currBets.map(bet => {
        if (bet.matchId !== matchId || bet.status !== "LIVE") return bet;

        let won = false;
        const totalGoals = finalScoreHome + finalScoreAway;
        const bothScored = finalScoreHome > 0 && finalScoreAway > 0;

        switch (bet.prediction) {
          case "HOME":
            won = finalScoreHome > finalScoreAway;
            break;
          case "DRAW":
            won = finalScoreHome === finalScoreAway;
            break;
          case "AWAY":
            won = finalScoreAway > finalScoreHome;
            break;
          case "OVER25":
            won = totalGoals > 2;
            break;
          case "UNDER25":
            won = totalGoals <= 2;
            break;
          case "BTTS_YES":
            won = bothScored;
            break;
          case "BTTS_NO":
            won = !bothScored;
            break;
        }

        const nextStatus = won ? "WON" : "LOST";

        if (won) {
          const payoutKES = bet.potentialPayout;
          const payoutMinor = Math.round(payoutKES * 100);
          const nextBalance = walletBalance + payoutMinor;
          onWalletUpdate?.(nextBalance, {
            id: `tx-${Date.now()}`,
            amount_minor: payoutMinor,
            type: "REFUND",
            description: `Winning payout for ${bet.matchName}`,
            created_at: new Date().toISOString()
          });
          toast.success(`🎉 Simulated WIN! You won KES ${payoutKES.toFixed(0)}!`);
        } else {
          toast.error(`😔 Your bet on ${bet.matchName} was unsuccessful.`);
        }

        return { ...bet, status: nextStatus };
      });
    });
  };

  // Place Bet Transaction Handler
  const handlePlaceBet = () => {
    if (!selectedBet) return;
    const stake = parseFloat(stakeInput);
    if (isNaN(stake) || stake <= 0) {
      toast.error("Please enter a valid stake amount.");
      return;
    }

    const balanceKES = walletBalance / 100;
    if (stake > balanceKES) {
      toast.error("Insufficient credit balance. Top-up or book less slots to free credits.");
      return;
    }

    startSubmitting(() => {
      const targetMatch = matches.find(m => m.id === selectedBet.matchId);
      if (!targetMatch) return;

      const payout = +(stake * selectedBet.odds).toFixed(2);
      const stakeMinor = Math.round(stake * 100);
      const nextBalance = walletBalance - stakeMinor;

      const newBet: Bet = {
        id: `bet-${Date.now()}`,
        matchId: selectedBet.matchId,
        matchName: `${targetMatch.homeTeam} vs ${targetMatch.awayTeam}`,
        marketName: selectedBet.label.split(":")[0],
        prediction: selectedBet.prediction,
        predictionLabel: selectedBet.label.split(":")[1].trim(),
        odds: selectedBet.odds,
        stake: stake,
        potentialPayout: payout,
        status: "LIVE",
        createdAt: new Date().toISOString()
      };

      onWalletUpdate?.(nextBalance, {
        id: `tx-${Date.now()}`,
        amount_minor: stakeMinor,
        type: "PAYMENT",
        description: `Bet placed on ${newBet.matchName}`,
        created_at: new Date().toISOString()
      });

      setPlacedBets(curr => [newBet, ...curr]);
      setSelectedBet(null);
      toast.success("🎫 Bet placed successfully! Stake deducted from wallet.");
    });
  };

  const handleOddsSelection = (matchId: string, market: keyof Match["odds"], prediction: Bet["prediction"], oddsValue: number, label: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match || match.status !== "LIVE") return;
    
    setSelectedBet({
      matchId,
      market,
      prediction,
      odds: oddsValue,
      label
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12 items-start text-left">
      
      {/* Left Column (8 cols): Match View & Odds Boards */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Toggle between Live Matches and Bet History */}
        <div className="flex gap-2 border-b border-cyan-blue/10 pb-3">
          <button
            onClick={() => setActiveTab("live")}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-heading uppercase tracking-wider transition ${
              activeTab === "live"
                ? "bg-gradient-to-r from-[#00FF87] to-[#60EFFF]/90 text-[#061208] shadow-[0_0_15px_rgba(0,255,135,0.25)]"
                : "bg-navy-panel/40 border border-cyan-blue/10 text-gray-muted hover:text-white-soft hover:bg-navy-panel"
            }`}
          >
            <Trophy className="inline h-3.5 w-3.5 mr-1.5" />
            Live Arena Matches
          </button>
          <button
            onClick={() => setActiveTab("bets")}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-heading uppercase tracking-wider transition ${
              activeTab === "bets"
                ? "bg-gradient-to-r from-[#00FF87] to-[#60EFFF]/90 text-[#061208] shadow-[0_0_15px_rgba(0,255,135,0.25)]"
                : "bg-navy-panel/40 border border-cyan-blue/10 text-gray-muted hover:text-white-soft hover:bg-navy-panel"
            }`}
          >
            <Receipt className="inline h-3.5 w-3.5 mr-1.5" />
            Placed Bet Tickets ({placedBets.length})
          </button>
        </div>

        {activeTab === "live" ? (
          <>
            {/* Live Matches List Selector */}
            <div className="grid gap-3 sm:grid-cols-3">
              {matches.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatchId(m.id)}
                  className={`glass-panel p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 text-left relative ${
                    selectedMatchId === m.id
                      ? "border-[#00FF87]/50 bg-navy-panel/85 shadow-[0_0_15px_rgba(0,255,135,0.06)]"
                      : "border-cyan-blue/10 hover:border-cyan-blue/30 bg-navy-panel/40 hover:bg-navy-panel/60"
                  }`}
                >
                  <div className="flex justify-between items-center w-full mb-1">
                    {m.status === "LIVE" ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#00FF87]/15 border border-[#00FF87]/30 text-[8px] font-heading font-extrabold uppercase tracking-wider text-[#00FF87] animate-pulse">
                        <span className="h-1 w-1 rounded-full bg-[#00FF87]" />
                        LIVE {m.timer}'
                      </span>
                    ) : m.status === "UPCOMING" ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-blue/15 border border-cyan-blue/30 text-[8px] font-heading font-extrabold uppercase tracking-wider text-cyan-blue">
                        <Clock className="h-2 w-2" />
                        IN {m.countdown}s
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-muted/15 border border-gray-muted/30 text-[8px] font-heading font-extrabold uppercase tracking-wider text-gray-muted">
                        ENDED
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-xs uppercase text-white-soft truncate">{m.homeTeam}</p>
                    <p className="font-heading font-bold text-xs uppercase text-white-soft truncate">{m.awayTeam}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-cyan-blue/5 flex items-center justify-between w-full">
                    <span className="text-[10px] text-gray-muted uppercase tracking-wider">Score</span>
                    <span className="font-heading font-extrabold text-sm text-[#00FF87] tracking-wider">
                      {m.status === "UPCOMING" ? "- : -" : `${m.scoreHome} - ${m.scoreAway}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Match Details & 3D Tracker */}
            <div className="grid gap-4 md:grid-cols-12 items-stretch">
              {/* Tracker Widget (5 cols) */}
              <div className="md:col-span-5 flex flex-col justify-between">
                <LiveMatchTracker3D matchState={activeMatch} />
                
                {/* Simulated events feed */}
                <div className="glass-panel p-3 rounded-xl border border-cyan-blue/10 mt-3 text-xs flex-1 flex flex-col justify-between min-h-[90px]">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-gray-muted mb-1 font-heading">Event Feed</span>
                    <p className="font-semibold text-white-soft italic leading-relaxed">
                      "{activeMatch.currentEvent}"
                    </p>
                  </div>
                  {activeMatch.goals.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-cyan-blue/5 flex gap-1.5 flex-wrap items-center">
                      <Trophy className="h-3 w-3 text-[#FFD700]" />
                      {activeMatch.goals.map((g, i) => (
                        <span key={i} className="text-[9px] bg-navy-panel px-1.5 py-0.5 rounded border border-cyan-blue/10 text-gray-muted">
                          {g.scorer} ({g.time}')
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Match Live Logs Console (7 cols) */}
              <div className="md:col-span-7 glass-panel p-4 rounded-2xl border border-cyan-blue/10 flex flex-col justify-between h-48 sm:h-auto">
                <span className="block text-[9px] uppercase tracking-wider text-gray-muted font-heading mb-2">Live Play-by-Play Ledger</span>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[11px] leading-relaxed max-h-[144px]">
                  {activeMatch.history.length === 0 ? (
                    <p className="text-gray-muted italic text-center py-4">Waiting for match kickoff...</p>
                  ) : (
                    activeMatch.history.map((log, idx) => (
                      <div key={idx} className="flex gap-2 items-start py-1 border-b border-cyan-blue/5">
                        <span className="text-[#00FF87] font-bold font-heading">⏱</span>
                        <p className="text-gray-muted">{log}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Odds Matrix Panels */}
            {activeMatch.status === "LIVE" ? (
              <div className="space-y-4">
                <h3 className="font-heading text-sm uppercase tracking-wider text-[#00FF87] flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  Direct Odds Matrix (Decimal)
                </h3>

                <div className="grid gap-4 md:grid-cols-3">
                  {/* 1X2 Full Time */}
                  <div className="glass-panel p-4 rounded-xl border border-cyan-blue/10">
                    <span className="block text-[10px] uppercase text-gray-muted font-heading tracking-wider mb-2">1X2 Match Result</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleOddsSelection(activeMatch.id, "home", "HOME", activeMatch.odds.home, "FT: Home Win")}
                        className={`py-2 px-1 rounded-lg text-center border font-heading font-bold text-xs uppercase transition ${
                          selectedBet?.matchId === activeMatch.id && selectedBet?.prediction === "HOME"
                            ? "bg-[#00FF87] border-[#00FF87] text-navy-deep"
                            : "bg-[#0A0F2C]/50 border-cyan-blue/10 hover:border-[#00FF87]/50 text-[#00FF87]"
                        }`}
                      >
                        <span className="block text-[8px] text-gray-muted font-sans font-medium mb-0.5">Home</span>
                        {activeMatch.odds.home.toFixed(2)}
                      </button>
                      <button
                        onClick={() => handleOddsSelection(activeMatch.id, "draw", "DRAW", activeMatch.odds.draw, "FT: Draw")}
                        className={`py-2 px-1 rounded-lg text-center border font-heading font-bold text-xs uppercase transition ${
                          selectedBet?.matchId === activeMatch.id && selectedBet?.prediction === "DRAW"
                            ? "bg-[#00FF87] border-[#00FF87] text-navy-deep"
                            : "bg-[#0A0F2C]/50 border-cyan-blue/10 hover:border-[#00FF87]/50 text-[#00FF87]"
                        }`}
                      >
                        <span className="block text-[8px] text-gray-muted font-sans font-medium mb-0.5">Draw</span>
                        {activeMatch.odds.draw.toFixed(2)}
                      </button>
                      <button
                        onClick={() => handleOddsSelection(activeMatch.id, "away", "AWAY", activeMatch.odds.away, "FT: Away Win")}
                        className={`py-2 px-1 rounded-lg text-center border font-heading font-bold text-xs uppercase transition ${
                          selectedBet?.matchId === activeMatch.id && selectedBet?.prediction === "AWAY"
                            ? "bg-[#00FF87] border-[#00FF87] text-navy-deep"
                            : "bg-[#0A0F2C]/50 border-cyan-blue/10 hover:border-[#00FF87]/50 text-[#00FF87]"
                        }`}
                      >
                        <span className="block text-[8px] text-gray-muted font-sans font-medium mb-0.5">Away</span>
                        {activeMatch.odds.away.toFixed(2)}
                      </button>
                    </div>
                  </div>

                  {/* Over / Under Goals */}
                  <div className="glass-panel p-4 rounded-xl border border-cyan-blue/10">
                    <span className="block text-[10px] uppercase text-gray-muted font-heading tracking-wider mb-2">Total Goals Over/Under 2.5</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOddsSelection(activeMatch.id, "over25", "OVER25", activeMatch.odds.over25, "Goals: Over 2.5")}
                        className={`py-2 px-1 rounded-lg text-center border font-heading font-bold text-xs uppercase transition ${
                          selectedBet?.matchId === activeMatch.id && selectedBet?.prediction === "OVER25"
                            ? "bg-[#00FF87] border-[#00FF87] text-navy-deep"
                            : "bg-[#0A0F2C]/50 border-cyan-blue/10 hover:border-[#00FF87]/50 text-[#00FF87]"
                        }`}
                      >
                        <span className="block text-[8px] text-gray-muted font-sans font-medium mb-0.5">Over 2.5</span>
                        {activeMatch.odds.over25.toFixed(2)}
                      </button>
                      <button
                        onClick={() => handleOddsSelection(activeMatch.id, "under25", "UNDER25", activeMatch.odds.under25, "Goals: Under 2.5")}
                        className={`py-2 px-1 rounded-lg text-center border font-heading font-bold text-xs uppercase transition ${
                          selectedBet?.matchId === activeMatch.id && selectedBet?.prediction === "UNDER25"
                            ? "bg-[#00FF87] border-[#00FF87] text-navy-deep"
                            : "bg-[#0A0F2C]/50 border-cyan-blue/10 hover:border-[#00FF87]/50 text-[#00FF87]"
                        }`}
                      >
                        <span className="block text-[8px] text-gray-muted font-sans font-medium mb-0.5">Under 2.5</span>
                        {activeMatch.odds.under25.toFixed(2)}
                      </button>
                    </div>
                  </div>

                  {/* Both Teams To Score (BTTS) */}
                  <div className="glass-panel p-4 rounded-xl border border-cyan-blue/10">
                    <span className="block text-[10px] uppercase text-gray-muted font-heading tracking-wider mb-2">Both Teams To Score</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOddsSelection(activeMatch.id, "bttsYes", "BTTS_YES", activeMatch.odds.bttsYes, "BTTS: Yes")}
                        className={`py-2 px-1 rounded-lg text-center border font-heading font-bold text-xs uppercase transition ${
                          selectedBet?.matchId === activeMatch.id && selectedBet?.prediction === "BTTS_YES"
                            ? "bg-[#00FF87] border-[#00FF87] text-navy-deep"
                            : "bg-[#0A0F2C]/50 border-cyan-blue/10 hover:border-[#00FF87]/50 text-[#00FF87]"
                        }`}
                      >
                        <span className="block text-[8px] text-gray-muted font-sans font-medium mb-0.5">Yes</span>
                        {activeMatch.odds.bttsYes.toFixed(2)}
                      </button>
                      <button
                        onClick={() => handleOddsSelection(activeMatch.id, "bttsNo", "BTTS_NO", activeMatch.odds.bttsNo, "BTTS: No")}
                        className={`py-2 px-1 rounded-lg text-center border font-heading font-bold text-xs uppercase transition ${
                          selectedBet?.matchId === activeMatch.id && selectedBet?.prediction === "BTTS_NO"
                            ? "bg-[#00FF87] border-[#00FF87] text-navy-deep"
                            : "bg-[#0A0F2C]/50 border-cyan-blue/10 hover:border-[#00FF87]/50 text-[#00FF87]"
                        }`}
                      >
                        <span className="block text-[8px] text-gray-muted font-sans font-medium mb-0.5">No</span>
                        {activeMatch.odds.bttsNo.toFixed(2)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-xl border border-orange/15 text-center flex flex-col items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-orange" />
                <h4 className="font-heading font-bold uppercase text-white-soft">Markets Closed</h4>
                <p className="text-xs text-gray-muted max-w-sm">
                  This simulated match is currently {activeMatch.status.toLowerCase()}. Keep an eye on it or select another live match to place bets!
                </p>
              </div>
            )}
          </>
        ) : (
          /* Placed Bets Dashboard Tab */
          <div className="space-y-4">
            <h3 className="font-heading text-sm uppercase tracking-wider text-[#00FF87] flex items-center gap-1.5">
              <Receipt className="h-4 w-4" />
              Placed Ticket Log
            </h3>
            
            <div className="space-y-3">
              {placedBets.length === 0 ? (
                <div className="glass-panel p-8 rounded-xl border border-cyan-blue/10 text-center italic text-xs text-gray-muted">
                  No betting slips placed yet. Place some stakes on live games to track them here!
                </div>
              ) : (
                placedBets.map(bet => (
                  <div
                    key={bet.id}
                    className={`glass-panel p-4 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all ${
                      bet.status === "WON" 
                        ? "border-[#00FF87]/30 bg-[#00FF87]/5" 
                        : bet.status === "LOST"
                        ? "border-red-500/20 bg-red-500/5 opacity-70"
                        : "border-cyan-blue/15"
                    }`}
                  >
                    <div>
                      <div className="flex gap-2 items-center mb-1">
                        <strong className="text-xs text-white-soft uppercase">{bet.matchName}</strong>
                        {bet.status === "LIVE" ? (
                          <span className="text-[8px] bg-cyan-blue/10 border border-cyan-blue/30 text-cyan-blue px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                            Active Slot
                          </span>
                        ) : bet.status === "WON" ? (
                          <span className="text-[8px] bg-[#00FF87]/15 border border-[#00FF87]/45 text-[#00FF87] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            WON Payout
                          </span>
                        ) : (
                          <span className="text-[8px] bg-gray-muted/15 border border-gray-muted/30 text-gray-muted px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Settled Lost
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-muted uppercase tracking-wider">
                        Market: <span className="font-semibold text-white-soft">{bet.marketName}</span> &middot; Prediction: <span className="font-bold text-[#60EFFF]">{bet.predictionLabel}</span>
                      </p>
                      <p className="text-[9px] text-gray-muted mt-1">Ticket Placed: {new Date(bet.createdAt).toLocaleTimeString()}</p>
                    </div>

                    <div className="flex gap-4 items-center justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <span className="block text-[8px] uppercase tracking-wider text-gray-muted">Odds & Stake</span>
                        <span className="font-heading font-extrabold text-xs text-white-soft">
                          @{bet.odds.toFixed(2)} &middot; KES {bet.stake}
                        </span>
                      </div>
                      <div className="text-right border-l border-cyan-blue/10 pl-4">
                        <span className="block text-[8px] uppercase tracking-wider text-gray-muted">
                          {bet.status === "WON" ? "Winnings Paid" : "Est. Return"}
                        </span>
                        <span className={`font-heading font-extrabold text-sm ${bet.status === "WON" ? "text-[#00FF87] text-glow-green" : "text-cyan-blue"}`}>
                          KES {bet.potentialPayout.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* Right Column (4 cols): Interactive Bet Slip Console */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Bet Slip Drawer Container */}
        <div className="glass-panel-glow p-5 rounded-2xl border border-green-electric/15 text-left relative overflow-hidden">
          {/* Grid background effect */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,135,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,135,0.02)_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] pointer-events-none" />
          
          <div className="flex items-center gap-2 border-b border-cyan-blue/10 pb-3 mb-4 relative z-10">
            <Coins className="h-5 w-5 text-[#00FF87] text-glow-green animate-bounce" />
            <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-white-soft">Live Bet Slip</h3>
          </div>

          {selectedBet ? (
            <div className="space-y-4 relative z-10 animate-slide-up">
              
              {/* Slip Card Details */}
              <div className="bg-[#0A0F2C]/50 border border-cyan-blue/15 rounded-xl p-3.5 relative overflow-hidden">
                <span className="block text-[8px] uppercase tracking-widest text-[#60EFFF] font-bold mb-0.5">Match Slip Selection</span>
                <strong className="block text-sm text-white-soft uppercase tracking-wide">
                  {matches.find(m => m.id === selectedBet.matchId)?.homeTeam} vs {matches.find(m => m.id === selectedBet.matchId)?.awayTeam}
                </strong>
                
                <div className="mt-3 flex justify-between items-center text-xs py-1 border-t border-cyan-blue/5">
                  <span className="text-gray-muted uppercase tracking-wider text-[10px]">Market Selection</span>
                  <span className="font-semibold text-white-soft uppercase text-[10px]">{selectedBet.label}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs py-1 border-t border-cyan-blue/5">
                  <span className="text-gray-muted uppercase tracking-wider text-[10px]">Market Odds</span>
                  <span className="font-heading font-extrabold text-sm text-[#00FF87] text-glow-green">
                    @{selectedBet.odds.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Stake input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] uppercase text-gray-muted tracking-wider">
                  <span>Stake Amount</span>
                  <span>Wallet: <strong className="text-[#00FF87]">{formatCurrency(walletBalance)}</strong></span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-heading font-bold text-sm text-gray-muted">KES</span>
                  <input
                    type="number"
                    value={stakeInput}
                    onChange={e => setStakeInput(e.target.value)}
                    placeholder="e.g. 200"
                    className="w-full bg-[#0A0F2C]/80 border border-cyan-blue/20 rounded-xl pl-10 pr-3 py-2.5 font-heading font-bold text-sm text-white-soft outline-none focus:border-green-electric/50 transition"
                  />
                </div>
              </div>

              {/* Returns calculations */}
              <div className="bg-[#121e15]/40 border border-cyan-blue/10 rounded-xl p-3.5 text-xs space-y-1.5">
                <div className="flex justify-between text-gray-muted uppercase text-[9px] tracking-wider">
                  <span>Stake Amount</span>
                  <span>KES {parseFloat(stakeInput) || 0}</span>
                </div>
                <div className="flex justify-between text-gray-muted uppercase text-[9px] tracking-wider">
                  <span>Slip Multiplier</span>
                  <span>@{selectedBet.odds.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-cyan-blue/5 pt-1.5 font-heading text-sm font-extrabold uppercase">
                  <span className="text-white-soft">Est. Payout</span>
                  <span className="text-[#60EFFF] text-glow-cyan">
                    KES {((parseFloat(stakeInput) || 0) * selectedBet.odds).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handlePlaceBet}
                disabled={isSubmitting}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl btn-electric font-heading uppercase text-sm tracking-widest text-[#061208] disabled:opacity-50 active:scale-95 shadow-[0_0_15px_rgba(0,255,135,0.2)] hover:shadow-[0_0_20px_rgba(96,239,255,0.4)]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-navy-deep" />
                    Committing Slip...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-navy-deep" />
                    Place Bet Now
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="py-8 text-center italic text-xs text-gray-muted relative z-10 flex flex-col items-center gap-2">
              <Trophy className="h-10 w-10 text-gray-muted/20 animate-pulse" />
              <p>Your Bet Slip is empty.</p>
              <p className="text-[10px] max-w-[200px] leading-relaxed">
                Click on any decimal odds badge from active live games on the left grid to prepare a bet!
              </p>
            </div>
          )}
        </div>

        {/* Dynamic Rules / Ledger guidelines */}
        <div className="glass-panel p-4 rounded-2xl border border-cyan-blue/10 text-xs">
          <span className="block text-[9px] uppercase tracking-wider text-[#60EFFF] font-heading mb-2">Arena Betting Ledger rules</span>
          <ul className="space-y-2 text-gray-muted list-disc list-inside leading-relaxed text-[11px]">
            <li>Virtual matches are accelerated (running fully in 60s).</li>
            <li>Stakes are deducted from your live wallet balance instantly.</li>
            <li>Bets automatically resolve upon full time. Winnings are deposited immediately in KES.</li>
            <li>Cashout holds are locked on booking tabs, betting operations cannot be cancelled once committed.</li>
          </ul>
        </div>

      </div>

    </div>
  );
}
