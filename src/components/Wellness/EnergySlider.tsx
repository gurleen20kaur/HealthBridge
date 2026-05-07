/**
 * EnergySlider — 1-10 slider with visual bar
 *
 * Reusable for energy, pain, sleep quality, etc. — any 1-N integer value.
 */

"use client";

interface EnergySliderProps {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  /** Color: orange (energy default), red (pain), blue (sleep) */
  color?: "orange" | "red" | "blue";
  lowLabel?: string;
  highLabel?: string;
}

export function EnergySlider({
  value,
  onChange,
  min = 1,
  max = 10,
  color = "orange",
  lowLabel = "Drained",
  highLabel = "Energized",
}: EnergySliderProps) {
  const colorClasses = {
    orange: "accent-orange-500",
    red: "accent-red-500",
    blue: "accent-blue-500",
  };

  const barColor = {
    orange: "bg-orange-400",
    red: "bg-red-400",
    blue: "bg-blue-400",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{lowLabel}</span>
        <span className="text-2xl font-bold text-slate-800 tabular-nums">
          {value}
          <span className="text-sm font-normal text-slate-400">/{max}</span>
        </span>
        <span className="text-xs text-slate-500">{highLabel}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className={`w-full h-2 rounded-full bg-slate-200 cursor-pointer ${colorClasses[color]}`}
      />

      {/* Visual bar (optional, doubles as a fill indicator) */}
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor[color]} transition-all`}
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
    </div>
  );
}
