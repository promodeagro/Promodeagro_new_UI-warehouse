import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Unit = {
  id: string;
  name: string;    // e.g., Kilogram
  symbol: string;  // e.g., kg
};

type UnitsContextValue = {
  units: Unit[];
  addUnit: (unit: Omit<Unit, "id">) => void;
  updateUnit: (id: string, update: Partial<Omit<Unit, "id">>) => void;
  removeUnit: (id: string) => void;
};

const UnitsContext = createContext<UnitsContextValue | undefined>(undefined);

const STORAGE_KEY = "warehouse.units";

// Default seed units requested by user
const DEFAULT_UNITS: Unit[] = [
  { id: "kg", name: "Kilogram", symbol: "kg" },
  { id: "g", name: "Gram", symbol: "g" },
  { id: "l", name: "Liter", symbol: "l" },
  { id: "pkt", name: "Packet", symbol: "pkt" },
  { id: "pcs", name: "Pieces", symbol: "pcs" },
  { id: "box", name: "Box", symbol: "box" },
  { id: "dz", name: "Dozen", symbol: "dz" },
];

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [units, setUnits] = useState<Unit[]>([]);

  // Load from localStorage with default seeding
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Unit[] = JSON.parse(raw);
        setUnits(parsed);
      } else {
        setUnits(DEFAULT_UNITS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_UNITS));
      }
    } catch {
      setUnits(DEFAULT_UNITS);
    }
  }, []);

  // Persist whenever units change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
    } catch {}
  }, [units]);

  const addUnit = (unit: Omit<Unit, "id">) => {
    // Prevent duplicates by symbol or name (case-insensitive)
    const exists = units.some(
      u => u.symbol.toLowerCase() === unit.symbol.toLowerCase() || u.name.toLowerCase() === unit.name.toLowerCase()
    );
    if (exists) return;
    const id = `${unit.symbol}-${Date.now()}`;
    setUnits(prev => [...prev, { id, ...unit }]);
  };

  const updateUnit = (id: string, update: Partial<Omit<Unit, "id">>) => {
    setUnits(prev => prev.map(u => (u.id === id ? { ...u, ...update } : u)));
  };

  const removeUnit = (id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
  };

  const value = useMemo<UnitsContextValue>(() => ({ units, addUnit, updateUnit, removeUnit }), [units]);

  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}

export function useUnits() {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error("useUnits must be used within UnitsProvider");
  return ctx;
}


