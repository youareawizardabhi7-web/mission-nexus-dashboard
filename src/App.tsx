/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowUpRight, 
  ArrowLeft, 
  ArrowRight, 
  UserPlus, 
  ChevronDown, 
  Radio, 
  Activity, 
  Volume2, 
  VolumeX, 
  Shield, 
  RefreshCw,
  Clock,
  Compass
} from 'lucide-react';

interface SpaceService {
  id: number;
  numLabel: string;
  description: string;
  stats: {
    label: string;
    value: string;
  }[];
}

const SERVICES: SpaceService[] = [
  {
    id: 1,
    numLabel: "ECLIPSE ALPHA (RESCUE DRONES)",
    description: `Mission Status: ACTIVE EMERGENCY RESPONSE

Destination: Saturn Ring Zone B

ETA: 2.4 Hours

Crew: Autonomous AI Swarm

Mission Priority: Critical`,
    stats: [
      { label: "Distance", value: "1.2B km" },
      { label: "Active Drones", value: "48 Units" },
      { label: "Signal Link", value: "22.4% (Intermittent)" },
      { label: "Quantum Sync", value: "Active" },
      { label: "Battery Power", value: "94%" },
      { label: "Local Anomaly", value: "8.4T" }
    ]
  },
  {
    id: 2,
    numLabel: "ECLIPSE BETA (FLEET SYNC)",
    description: `Mission Status: SCANNING & PAIRING

Destination: Titan Outpost

ETA: Ongoing

Crew: 12 Crew Members

Mission Priority: High`,
    stats: [
      { label: "Altitude", value: "1,200 km (Titan)" },
      { label: "Drift Speed", value: "42,000 km/h" },
      { label: "Comm Band", value: "Sub-space Band 9" },
      { label: "Shield Status", value: "88% (Deflecting)" },
      { label: "Life Support", value: "Nominal" },
      { label: "Telemetry Link", value: "Quantum Encrypt" }
    ]
  },
  {
    id: 3,
    numLabel: "ECLIPSE GAMMA (ANOMALY SCANNER)",
    description: `Mission Status: COLLECTING DATA

Destination: Saturn Magnetosphere

ETA: In-situ

Crew: Automated Probe

Mission Priority: High`,
    stats: [
      { label: "Flux Density", value: "420 mW/m²" },
      { label: "Temp Gradient", value: "-180°C" },
      { label: "Sensor Integrity", value: "91%" },
      { label: "Fuel Level", value: "Ion Prop 74%" },
      { label: "Radiation Index", value: "120 mSv/h (Critical)" },
      { label: "Buffer Storage", value: "84% (Syncing)" }
    ]
  },
  {
    id: 4,
    numLabel: "ECLIPSE DELTA (RESCUE SHUTTLE)",
    description: `Mission Status: EN ROUTE TO SURVIVORS

Destination: Enceladus Base

ETA: 1.5 Hours

Crew: 4 Rangers

Mission Priority: Maximum`,
    stats: [
      { label: "Distance", value: "240,000 km" },
      { label: "Velocity", value: "54,000 km/h" },
      { label: "Fuel Remaining", value: "89% (Fusion)" },
      { label: "Signal Strength", value: "42.8% (Degraded)" },
      { label: "Medical Bay", value: "Ready" },
      { label: "Telemetry", value: "Sub-space Relay" }
    ]
  },
  {
    id: 5,
    numLabel: "ECLIPSE EPSILON (SATELLITE NET)",
    description: `Mission Status: RE-ALIGNING CONSTELLATION

Destination: Saturn Orbit

ETA: 18 Minutes

Crew: Automated System

Mission Priority: Critical`,
    stats: [
      { label: "Orbit Type", value: "Polar" },
      { label: "Satellites Active", value: "14/18 Units" },
      { label: "Sync Error Rate", value: "0.04%" },
      { label: "Signal Gain", value: "+18dB" },
      { label: "Power Source", value: "Fusion Cells" },
      { label: "Uplink Status", value: "Establishing" }
    ]
  }
];

interface GroundStation {
  id: string;
  name: string;
  fullName: string;
  coordinates: string;
  timezone: string;
  utcOffset: number;
}

const GROUND_STATIONS: GroundStation[] = [
  {
    id: "NPR",
    name: "NOVA PRIME HQ",
    fullName: "Nova Prime Orbital Station",
    coordinates: "SEC 01 // ORBIT-A (SATURN)",
    timezone: "GST",
    utcOffset: 0
  },
  {
    id: "LUN",
    name: "LUNAR GATEWAY",
    fullName: "Lunar Relay Hub (Earth Orbit)",
    coordinates: "SEC 04 // EARTH-MOON L2",
    timezone: "LST",
    utcOffset: 2
  },
  {
    id: "MAR",
    name: "MARS CITY",
    fullName: "Mars Colony One Command",
    coordinates: "SEC 09 // ELYSIUM PLANITIA",
    timezone: "MST",
    utcOffset: -3
  },
  {
    id: "EUR",
    name: "EUROPA LINK",
    fullName: "Europa Sub-station (Jupiter Orbit)",
    coordinates: "SEC 12 // GALILEAN CORE",
    timezone: "EST",
    utcOffset: 5
  }
];

export default function App() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedStation, setSelectedStation] = useState<GroundStation>(GROUND_STATIONS[0]);
  const [useLiveClock, setUseLiveClock] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'info' | 'success' }[]>([]);
  const [signalStrength, setSignalStrength] = useState(94);
  const toastIdCounter = useRef(0);

  // Audio synthesizer helper
  const playBeep = (type: 'click' | 'success' | 'hover' | 'warning') => {
    if (!audioEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.008, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        osc.frequency.setValueAtTime(1400, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.025, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'warning') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
      }
    } catch (e) {
      console.warn("Audio Context blocked or not supported by browser", e);
    }
  };

  // Live clock trigger
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Randomize signal strength for realism
    const signalTimer = setInterval(() => {
      setSignalStrength(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.min(100, Math.max(85, prev + delta));
      });
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(signalTimer);
    };
  }, []);

  const addToast = (message: string, type: 'info' | 'success' = 'info') => {
    const id = toastIdCounter.current++;
    setToasts(prev => [...prev, { id, message, type }]);
    playBeep(type === 'success' ? 'success' : 'click');
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleNextSlide = () => {
    playBeep('click');
    setActiveSlide((prev) => (prev + 1) % SERVICES.length);
  };

  const handlePrevSlide = () => {
    playBeep('click');
    setActiveSlide((prev) => (prev - 1 + SERVICES.length) % SERVICES.length);
  };

  const selectSlide = (index: number) => {
    playBeep('click');
    setActiveSlide(index);
  };

  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    if (newState) {
      setTimeout(() => {
        // Play success tone to confirm active
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(1000, ctx.currentTime);
          gain.gain.setValueAtTime(0.02, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        } catch (e) {}
      }, 50);
    }
  };

  // Retrieve calculated localized time strings based on ground station offsets
  const getLocalizedTime = (station: GroundStation) => {
    if (!useLiveClock) {
      // Historical launch overlay: 22:42:00
      return "22:42:00";
    }
    // Calculate custom UTC time offset
    const utcTime = currentTime.getTime() + (currentTime.getTimezoneOffset() * 60000);
    const localTime = new Date(utcTime + (3600000 * station.utcOffset));
    return localTime.toTimeString().split(' ')[0];
  };

  const getLocalizedDate = () => {
    if (!useLiveClock) {
      // Reference static date matching image exactly
      return {
        month: "NEXUS-CYCLE",
        dayAndYear: "89th , 2189"
      };
    }
    // Live calculated date
    const utcTime = currentTime.getTime() + (currentTime.getTimezoneOffset() * 60000);
    const localTime = new Date(utcTime + (3600000 * selectedStation.utcOffset));
    const months = [
      "CYCLE-01", "CYCLE-02", "CYCLE-03", "CYCLE-04", "CYCLE-05", "CYCLE-06",
      "CYCLE-07", "CYCLE-08", "CYCLE-09", "CYCLE-10", "CYCLE-11", "CYCLE-12"
    ];
    const month = months[localTime.getMonth()];
    const day = localTime.getDate();
    
    // Add custom suffixes
    let suffix = "th";
    if (day === 1 || day === 21 || day === 31) suffix = "st";
    else if (day === 2 || day === 22) suffix = "nd";
    else if (day === 3 || day === 23) suffix = "rd";

    return {
      month: month,
      dayAndYear: `${day}${suffix} , 2189`
    };
  };

  const handleStationClick = (station: GroundStation) => {
    playBeep('click');
    setSelectedStation(station);
    addToast(`ESTABLISHED DATALINK WITH ${station.name}`, 'success');
  };

  const handleSpaceTravelAction = () => {
    addToast(`DEPLOYING AUTONOMOUS DRONES INTO SATURN RING SECTOR ALPHA // INITIALIZING FLIGHT PATH...`, 'success');
  };

  const handleContactAction = () => {
    addToast(`BROADCASTING SUB-SPACE COMM SIGNAL OVER QUANTUM CHANNELS // SYNCING CORRIDOR...`, 'info');
  };

  const handleScrollPrompt = () => {
    addToast(`DECRYPTING ANOMALY PROFILE LOGS // SPECTRAL DENSITY ANALYSIS COMPILED.`, 'info');
  };

  // Telemetry real-time waveform generator
  const TelemetryWave = () => {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
      let animationId: number;
      const update = () => {
        setPhase((prev) => (prev + 0.12) % (Math.PI * 2));
        animationId = requestAnimationFrame(update);
      };
      animationId = requestAnimationFrame(update);
      return () => cancelAnimationFrame(animationId);
    }, []);

    const points = [];
    for (let i = 0; i <= 100; i++) {
      const x = i;
      const y = 16 + 
        Math.sin(i * 0.14 + phase) * 6 + 
        Math.cos(i * 0.32 - phase * 0.6) * 3 +
        Math.sin(i * 0.65 + phase * 1.5) * 1.2;
      points.push(`${x},${y}`);
    }
    const pathData = `M ${points.join(' L ')}`;

    return (
      <svg className="w-full h-10 text-white/40" viewBox="0 0 100 32" preserveAspectRatio="none">
        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          className="transition-all duration-75"
        />
      </svg>
    );
  };

  const formattedDate = getLocalizedDate();
  const currentService = SERVICES[activeSlide];

  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-x-hidden font-sans select-none flex flex-col justify-between">
      
      {/* Immersive Space Video Background (Muted, looping, unzoomed, bright and high visibility) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 flex items-center justify-center">
        {/* Ambient blue background glow for extra brightness */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,119,255,0.18)_0%,transparent_75%)]"></div>
        <video
          src="https://res.cloudinary.com/je46ocqq/video/upload/v1783802237/kling_20260712_Image_to_Video_create_a_s_977_0_1_grjkg5.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-contain opacity-100 brightness-130 saturate-150 scale-100"
        />
        {/* Soft atmospheric overlay for readability while keeping the video extremely bright and prominent */}
        <div className="absolute inset-0 bg-black/5"></div>
        {/* Radial vignette and edge-shadow overlays to seamlessly blend the video borders into pure black background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"></div>
      </div>

      {/* 1. Structural division lines (Grid overlays) matching reference layout */}
      <div className="absolute inset-0 w-full h-full pointer-events-none flex justify-between z-0 px-6 md:px-12">
        <div className="w-[1px] h-full bg-neon/10"></div>
        <div className="w-[1px] h-full bg-neon/10"></div>
        <div className="w-[1px] h-full bg-neon/10 hidden lg:block"></div>
        <div className="w-[1px] h-full bg-neon/10 hidden lg:block"></div>
        <div className="w-[1px] h-full bg-neon/10"></div>
        <div className="w-[1px] h-full bg-neon/10"></div>
      </div>

      {/* Structural HUD Crosshair Overlays */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-neon/10"></div>
        <div className="absolute top-0 left-1/2 h-full w-[1px] bg-neon/10"></div>
      </div>

      {/* Structural HUD Layer: Corners (Immersive 12x12 double-border corner accents) */}
      <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-neon pointer-events-none z-20"></div>
      <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-neon pointer-events-none z-20"></div>
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-neon pointer-events-none z-20"></div>
      <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-neon pointer-events-none z-20"></div>

      {/* 2. Header / Navigation */}
      <header className="relative w-full max-w-[1440px] mx-auto px-6 md:px-12 pt-8 pb-6 flex items-center justify-between z-20 border-b border-neon/30 bg-transparent">
        {/* Left: Brand Logo in futuristic Orbitron Font with neon elements */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => addToast("MISSION NEXUS COMMAND DECK STATUS: ACTIVE & ENCRYPTED", 'success')}
          onMouseEnter={() => playBeep('hover')}
        >
          <span className="font-orbitron text-2xl font-black tracking-[0.2em] text-white group-hover:text-neon transition-colors duration-300">
            Mission Nexus
          </span>
          <div className="flex items-center gap-1 bg-neon/15 border border-neon/30 rounded px-1.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse"></span>
            <span className="text-[7px] font-mono tracking-widest font-bold text-white">LIVE</span>
          </div>
        </div>

        {/* Center: Main Navigation options with transparent background layers */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-4">
          {["MONITOR", "FLEET SYNC", "DRONE CONTROL", "TELEMETRY", "SYS DIAGS"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={(e) => {
                e.preventDefault();
                playBeep('click');
                addToast(`RETRIEVING NAVIGATION NODE // SECURE ROUTE: ${item}`, 'info');
              }}
              onMouseEnter={() => playBeep('hover')}
              className="font-display text-[10px] font-bold tracking-[0.2em] text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white px-4 py-2 rounded transition-all duration-300 uppercase cursor-pointer"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Right: Join Button + Web Audio Toggle */}
        <div className="flex items-center gap-4">
          {/* Audio Console Control Switch */}
          <button 
            onClick={toggleAudio}
            onMouseEnter={() => playBeep('hover')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border ${
              audioEnabled 
                ? "border-neon text-white bg-neon/10" 
                : "border-white/20 text-white bg-transparent hover:border-white"
            } transition-all duration-300 text-[9px] tracking-widest font-mono uppercase cursor-pointer`}
            title={audioEnabled ? "Disable HUD Audio Feedback" : "Enable HUD Audio Feedback"}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-white" /> : <VolumeX className="w-3.5 h-3.5 text-white" />}
            <span className="hidden sm:inline">{audioEnabled ? "COMMS FEED ON" : "COMMS FEED MUTED"}</span>
          </button>

          {/* Become a Member themed button */}
          <button
            onClick={() => addToast("OVERRIDING SECTOR PROTOCOLS // DEPLOYING EMERGENCY RELAY STATIONS...", 'success')}
            onMouseEnter={() => playBeep('hover')}
            className="flex items-center gap-2 border border-white hover:border-white rounded-full py-1.5 px-5 bg-white/5 text-white hover:text-black hover:bg-white transition-all duration-300 text-[10px] md:text-xs font-display tracking-widest uppercase cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tactical Override</span>
          </button>
        </div>
      </header>

      {/* 3. Main Hero Dashboard Overlay Grid */}
      <main className="relative w-full max-w-[1440px] mx-auto px-6 md:px-12 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-6 z-10">
        
        {/* Left Columns (5 spans) -> PIONEERING THE NEXT ERA... */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-6 md:space-y-8 text-left z-10">
          
          {/* Mission System Active Indicator Bar with high-fidelity neon styles */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] tracking-widest font-sans text-white/70 border-b border-neon/20 pb-4">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
              COMMAND DECK • NOVA PRIME
            </span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-white" />
              SIGNAL: <span className="text-white font-bold">42.1% (EMERGENCY)</span>
            </span>
            <span className="text-white/20">|</span>
            <span className="text-white flex items-center gap-1.5 animate-pulse font-bold">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              TELEMETRY SYNCED
            </span>
          </div>

          {/* Main Typography Header matching OrbitX design precisely, styled with immersive HUD glows */}
          <div className="space-y-1">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tight leading-[0.95] text-white drop-shadow-[0_0_15px_rgba(0,119,255,0.4)]">
              Mission <br />
              <span className="text-white">Nexus</span> <br />
              <span className="text-white">Saturn</span> <br />
              Sector
            </h1>
          </div>

          {/* Core static statement below the title */}
          <div className="border-l-2 border-neon/40 pl-4 py-1">
            <p className="font-sans text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] leading-relaxed text-white uppercase max-w-md">
              TACTICAL OS FOR INTERPLANETARY COMMAND. ACTIVATED TO RESTORE FLEET COMMUNICATIONS, DEPLOY AUTONOMOUS RESCUE DRONES, AND MONITOR REAL-TIME TELEMETRY IN THE SATURN SYSTEM.
            </p>
          </div>

          {/* Action CTAs: High contrast neon immersive action items */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-2">
            {/* Primary high-contrast button matching Immersive style */}
            <button
              onClick={handleSpaceTravelAction}
              onMouseEnter={() => playBeep('hover')}
              className="group flex items-center gap-5 border border-white bg-white text-black rounded-full py-1.5 pl-6 pr-1.5 hover:bg-transparent hover:border-white hover:text-white transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.35)] font-bold uppercase tracking-widest text-xs"
            >
              <span className="font-display tracking-[0.15em]">
                Initialize Rescue
              </span>
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </button>

            {/* Secondary Contact Link button */}
            <button
              onClick={handleContactAction}
              onMouseEnter={() => playBeep('hover')}
              className="flex items-center gap-1.5 font-display text-xs tracking-[0.2em] text-white hover:text-white/80 transition-all duration-300 group uppercase py-2 cursor-pointer border-b border-transparent hover:border-white"
            >
              <span>Restore Comms</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>

        {/* Center Space Column (2 spans) -> Rotating scanner HUD circle and minimal scroll indicator */}
        <div className="lg:col-span-2 flex flex-col justify-end items-center h-full min-h-[160px] lg:min-h-[440px] pb-4 z-10 relative">
          
          {/* Concentric scanner circle matching the immersive theme's focal layout */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 lg:w-72 lg:h-72 border border-neon/5 rounded-full flex items-center justify-center pointer-events-none z-0">
            <div className="w-40 h-40 lg:w-60 lg:h-60 border border-neon/15 rounded-full flex items-center justify-center">
              <div className="w-32 h-32 lg:w-48 lg:h-48 border-2 border-dashed border-neon/25 rounded-full animate-[spin_30s_linear_infinite] flex flex-col items-center justify-center">
                <span className="text-[8px] tracking-[0.3em] text-neon/30 font-bold">SCANNING...</span>
              </div>
            </div>
          </div>

          <div 
            onClick={handleScrollPrompt}
            onMouseEnter={() => playBeep('hover')}
            className="flex flex-col items-center gap-3 cursor-pointer group z-10"
          >
            {/* Minimal vertical tracking line */}
            <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-neon/20 to-neon group-hover:h-20 transition-all duration-500"></div>
            
            {/* Let's Scroll Badge */}
            <div className="rounded-full border border-neon/30 group-hover:border-neon px-5 py-2 flex items-center gap-2 text-[9px] tracking-[0.3em] text-white group-hover:text-white transition-all duration-300 uppercase bg-black/90 shadow-[0_0_12px_rgba(0,119,255,0.25)]">
              <span>Sys Logs</span>
              <ChevronDown className="w-3 h-3 text-white group-hover:text-white group-hover:translate-y-0.5 transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Right Columns (5 spans) -> Key Services Carousel & Location Dashboard */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-10 lg:space-y-12 text-left z-10">
          
          {/* Key Services Slider Section with Immersive Neon Frame (Fully Transparent) */}
          <div className="border border-neon/30 bg-transparent p-6 md:p-8 rounded-lg space-y-6 relative overflow-hidden">
            {/* Key Services structural header line */}
            <div className="flex items-center justify-between border-b border-neon/20 pb-4">
              <span className="font-display text-[10px] font-bold tracking-[0.25em] text-white uppercase">
                Sector Overview
              </span>
              <span className="font-sans text-[9px] text-white/50 uppercase tracking-widest">
                OPERATION ECLIPSE // TACTICAL SECTORS
              </span>
            </div>

            {/* Slider content wrapper with AnimatePresence */}
            <div className="min-h-[140px] md:min-h-[120px] relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentService.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  <h3 className="font-display text-lg md:text-xl font-bold tracking-wider text-white uppercase drop-shadow-[0_0_8px_rgba(0,119,255,0.3)]">
                    {currentService.numLabel}
                  </h3>
                  <p className="font-sans text-[11px] leading-relaxed text-white tracking-wide uppercase whitespace-pre-line">
                    {currentService.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slider Controls matching reference design exactly */}
            <div className="flex items-center justify-between pt-3 border-t border-neon/20">
              {/* Dots navigation in neon cyan */}
              <div className="flex items-center gap-2">
                {SERVICES.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => selectSlide(idx)}
                    onMouseEnter={() => playBeep('hover')}
                    className="relative group p-1 focus:outline-none"
                    aria-label={`Go to slide ${idx + 1}`}
                  >
                    {/* Ring indicator */}
                    <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                      activeSlide === idx 
                        ? "border border-neon scale-125 bg-transparent shadow-[0_0_8px_rgba(0,119,255,0.5)]" 
                        : "border border-neon/30 bg-transparent group-hover:border-neon/60"
                    }`}>
                      {/* Innermost dot */}
                      <div className={`w-1 h-1 rounded-full ${
                        activeSlide === idx ? "bg-neon" : "bg-transparent"
                      }`} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevSlide}
                  onMouseEnter={() => playBeep('hover')}
                  className="w-8 h-8 rounded-full border border-neon/30 hover:border-neon text-white hover:text-white flex items-center justify-center transition-all duration-300 bg-black/40 cursor-pointer"
                  aria-label="Previous Slide"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextSlide}
                  onMouseEnter={() => playBeep('hover')}
                  className="w-8 h-8 rounded-full border border-neon/30 hover:border-neon text-white hover:text-white flex items-center justify-center transition-all duration-300 bg-black/40 cursor-pointer"
                  aria-label="Next Slide"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Technical Telemetry Stats Module */}
          <div className="border border-neon/30 bg-neon/5 p-6 rounded-lg space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-[10px] tracking-widest font-sans text-white/90">
              <span className="flex items-center gap-1.5 font-bold uppercase">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                QUANTUM DATALINK STATUS
              </span>
              <span className="text-white/60">E-M SPECTRUM BAND</span>
            </div>

            {/* Dynamic Real-Time Waveform */}
            <div className="w-full bg-black border border-neon/20 rounded py-2 px-3 overflow-hidden">
              <TelemetryWave />
            </div>

            {/* Real-time calculated parameter variables with neon borders */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-1">
              {currentService.stats.map((stat, i) => (
                <div key={i} className="flex flex-col border-l-2 border-neon/30 pl-3">
                  <span className="font-sans text-[8px] text-white/60 tracking-wider uppercase">
                    {stat.label}
                  </span>
                  <span className="font-sans text-xs text-white font-semibold tracking-wide uppercase mt-0.5">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Right Layout - Date, Local GCS Clock, Ground Station Selector */}
          <div className="flex flex-col space-y-4 pt-2">
            {/* Ground Station Selection Tabs */}
            <div className="flex flex-col space-y-1.5">
              <span className="font-sans text-[8px] text-white/60 tracking-[0.25em] uppercase">
                SELECT TACTICAL RELAY STATION
              </span>
              <div className="grid grid-cols-4 gap-1 border border-neon/20 p-1 rounded bg-black/80">
                {GROUND_STATIONS.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => handleStationClick(station)}
                    className={`py-1 text-[9px] font-sans tracking-widest font-bold transition-all duration-200 rounded cursor-pointer ${
                      selectedStation.id === station.id
                        ? "bg-neon text-white shadow-[0_0_10px_rgba(0,119,255,0.5)]"
                        : "text-white/60 hover:text-white bg-transparent"
                    }`}
                  >
                    {station.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Location block mimicking design EXACTLY */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-t border-neon/30 pt-4">
              
              {/* Column 1: Month and Day (styled like reference text) */}
              <div className="flex flex-col">
                <span className="font-display text-4xl font-extrabold tracking-wider uppercase text-white leading-none">
                  {formattedDate.month}
                </span>
                <span className="font-display text-3xl font-bold tracking-widest text-white leading-none mt-1">
                  {formattedDate.dayAndYear}
                </span>
                <span className="font-sans text-[10px] text-white/60 tracking-[0.25em] uppercase mt-2.5">
                  {selectedStation.fullName}
                </span>
              </div>

              {/* Column 2: Coordinate system + local station ticking clock */}
              <div className="flex flex-col items-start sm:items-end text-left sm:text-right space-y-1">
                {/* Time toggle (static landmark vs real-time) */}
                <div className="flex items-center gap-1.5 text-[8px] tracking-[0.2em] font-sans text-white/50">
                  <span>CLOCK SOURCE:</span>
                  <button
                    onClick={() => {
                      playBeep('click');
                      setUseLiveClock(!useLiveClock);
                      addToast(
                        useLiveClock 
                          ? "LOCKED CLOCK SOURCE TO MISSION REFERENCE (NEXUS-CYCLE 2189)" 
                          : "CLOCK SOURCE SYNCHRONIZED TO LOCAL GALACTIC BEACON",
                        'info'
                      );
                    }}
                    onMouseEnter={() => playBeep('hover')}
                    className="text-white hover:underline focus:outline-none uppercase font-bold flex items-center gap-1 border border-neon/20 px-1.5 py-0.5 rounded bg-black"
                  >
                    <Clock className="w-2.5 h-2.5 text-neon" />
                    {useLiveClock ? "SYSTEM" : "MISSION"}
                  </button>
                </div>

                {/* Local ticking clock in white */}
                <div className="font-sans text-xl text-white font-semibold tracking-widest drop-shadow-[0_0_8px_rgba(0,119,255,0.3)]">
                  {getLocalizedTime(selectedStation)}{" "}
                  <span className="text-[10px] font-bold text-white/60">
                    {selectedStation.timezone}
                  </span>
                </div>

                {/* Local Coordinates */}
                <div className="font-sans text-[9px] text-white/70 tracking-wider flex items-center gap-1">
                  <Compass className="w-2.5 h-2.5 text-white/40" />
                  <span>COORDS: {selectedStation.coordinates}</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* 4. Mini Footer / Credit Bar */}
      <footer className="relative w-full max-w-[1440px] mx-auto px-6 md:px-12 py-4 flex flex-col sm:flex-row items-center justify-between text-[9px] tracking-[0.25em] font-sans text-white/50 z-10 border-t border-neon/20 gap-2">
        <div className="flex items-center gap-2">
          <span>MISSION NEXUS CONTROL UNIT // ORBITAL DECK</span>
          <span className="text-white/20">|</span>
          <span>QUANTUM DATA TUNNEL ENCRYPTED</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => addToast("COMMAND DECK CORE SECURE // QUANTUM OVERLAYS SYNCHRONIZED", 'info')}
            className="hover:text-white transition-colors uppercase cursor-pointer"
          >
            COMMAND SCHEMATICS
          </button>
          <span className="text-white/25">/</span>
          <span>MISSION NEXUS DEPLOYMENT UNIT</span>
        </div>
      </footer>

      {/* Toast Notification Ingress System */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-3 rounded border text-[10px] font-mono tracking-wider flex items-start gap-2.5 shadow-lg shadow-black backdrop-blur-md pointer-events-auto ${
                toast.type === 'success'
                  ? 'border-neon/40 bg-black/90 text-white'
                  : 'border-neon/20 bg-black/95 text-neon/80'
              }`}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-neon mt-1 animate-ping" />
              <div className="flex-1 space-y-1">
                <div className="font-bold uppercase text-neon tracking-widest text-[8px]">
                  {toast.type === 'success' ? 'SYSTEM TELEGRAM' : 'MISSION LOG'}
                </div>
                <div className="uppercase leading-normal">{toast.message}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
