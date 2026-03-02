import { Globe } from "lucide-react";
import { CURRENCIES, type CurrencyInfo } from "@/hooks/useCurrency";

interface CurrencySelectorProps {
  currentCode: string;
  onSelect: (code: string) => void;
  currency: CurrencyInfo;
}

const CurrencySelector = ({ currentCode, onSelect, currency }: CurrencySelectorProps) => {
  return (
    <div className="mt-4 relative">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/20 border border-primary/40 shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:shadow-[0_0_20px_rgba(0,212,255,0.25)] transition-all duration-300">
        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
          <Globe size={14} className="text-primary" />
        </div>
        <select
          value={currentCode}
          onChange={(e) => onSelect(e.target.value)}
          className="flex-1 bg-transparent border-none text-sm font-display text-foreground focus:outline-none cursor-pointer appearance-none font-semibold"
          style={{ backgroundImage: 'none' }}
        >
          {Object.entries(CURRENCIES).map(([key, val]) => (
            <option key={key} value={key} className="bg-background text-foreground">
              {val.flag} {val.name} ({val.symbol})
            </option>
          ))}
        </select>
        <span className="text-xs font-display font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/30">
          {currency.flag} {currency.code}
        </span>
      </div>
      <p className="text-[10px] text-primary/70 mt-1.5 text-center font-display tracking-wider">
        🌍 SELECT YOUR COUNTRY TO SEE LOCAL PRICE
      </p>
    </div>
  );
};

export default CurrencySelector;
