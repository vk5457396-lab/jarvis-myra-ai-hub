import { Globe } from "lucide-react";
import { CURRENCIES, type CurrencyInfo } from "@/hooks/useCurrency";

interface CurrencySelectorProps {
  currentCode: string;
  onSelect: (code: string) => void;
  currency: CurrencyInfo;
}

const CurrencySelector = ({ currentCode, onSelect, currency }: CurrencySelectorProps) => {
  return (
    <div className="flex items-center gap-2 mt-4">
      <Globe size={14} className="text-muted-foreground" />
      <select
        value={currentCode}
        onChange={(e) => onSelect(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-display text-foreground focus:outline-none focus:border-primary/50 cursor-pointer appearance-none"
        style={{ backgroundImage: 'none' }}
      >
        {Object.entries(CURRENCIES).map(([key, val]) => (
          <option key={key} value={key} className="bg-background text-foreground">
            {val.flag} {val.name} ({val.symbol})
          </option>
        ))}
      </select>
      <span className="text-[10px] text-muted-foreground">
        {currency.flag} {currency.code}
      </span>
    </div>
  );
};

export default CurrencySelector;
