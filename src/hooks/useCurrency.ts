import { useState, useEffect, createContext, useContext } from "react";

interface CurrencyInfo {
  code: string;
  symbol: string;
  rate: number; // rate relative to INR (1 INR = X of this currency)
  name: string;
  flag: string;
}

// International markup: ₹899 → ₹1299 equivalent (~44% markup for international)
const INTERNATIONAL_MARKUP = 1.445;

const CURRENCIES: Record<string, CurrencyInfo> = {
  IN: { code: "INR", symbol: "₹", rate: 1, name: "Indian Rupee", flag: "🇮🇳" },
  US: { code: "USD", symbol: "$", rate: 0.012, name: "US Dollar", flag: "🇺🇸" },
  GB: { code: "GBP", symbol: "£", rate: 0.0095, name: "British Pound", flag: "🇬🇧" },
  CA: { code: "CAD", symbol: "C$", rate: 0.0163, name: "Canadian Dollar", flag: "🇨🇦" },
  AU: { code: "AUD", symbol: "A$", rate: 0.0185, name: "Australian Dollar", flag: "🇦🇺" },
  EU: { code: "EUR", symbol: "€", rate: 0.011, name: "Euro", flag: "🇪🇺" },
  DE: { code: "EUR", symbol: "€", rate: 0.011, name: "Euro", flag: "🇩🇪" },
  FR: { code: "EUR", symbol: "€", rate: 0.011, name: "Euro", flag: "🇫🇷" },
  IT: { code: "EUR", symbol: "€", rate: 0.011, name: "Euro", flag: "🇮🇹" },
  ES: { code: "EUR", symbol: "€", rate: 0.011, name: "Euro", flag: "🇪🇸" },
  NL: { code: "EUR", symbol: "€", rate: 0.011, name: "Euro", flag: "🇳🇱" },
  BE: { code: "EUR", symbol: "€", rate: 0.011, name: "Euro", flag: "🇧🇪" },
  AT: { code: "EUR", symbol: "€", rate: 0.011, name: "Euro", flag: "🇦🇹" },
  PT: { code: "EUR", symbol: "€", rate: 0.011, name: "Euro", flag: "🇵🇹" },
  IE: { code: "EUR", symbol: "€", rate: 0.011, name: "Euro", flag: "🇮🇪" },
  FI: { code: "EUR", symbol: "€", rate: 0.011, name: "Euro", flag: "🇫🇮" },
  GR: { code: "EUR", symbol: "€", rate: 0.011, name: "Euro", flag: "🇬🇷" },
  AE: { code: "AED", symbol: "د.إ", rate: 0.044, name: "UAE Dirham", flag: "🇦🇪" },
  SA: { code: "SAR", symbol: "﷼", rate: 0.045, name: "Saudi Riyal", flag: "🇸🇦" },
  JP: { code: "JPY", symbol: "¥", rate: 1.78, name: "Japanese Yen", flag: "🇯🇵" },
  CN: { code: "CNY", symbol: "¥", rate: 0.087, name: "Chinese Yuan", flag: "🇨🇳" },
  KR: { code: "KRW", symbol: "₩", rate: 16.2, name: "Korean Won", flag: "🇰🇷" },
  SG: { code: "SGD", symbol: "S$", rate: 0.016, name: "Singapore Dollar", flag: "🇸🇬" },
  MY: { code: "MYR", symbol: "RM", rate: 0.053, name: "Malaysian Ringgit", flag: "🇲🇾" },
  TH: { code: "THB", symbol: "฿", rate: 0.41, name: "Thai Baht", flag: "🇹🇭" },
  ID: { code: "IDR", symbol: "Rp", rate: 189, name: "Indonesian Rupiah", flag: "🇮🇩" },
  PH: { code: "PHP", symbol: "₱", rate: 0.67, name: "Philippine Peso", flag: "🇵🇭" },
  VN: { code: "VND", symbol: "₫", rate: 301, name: "Vietnamese Dong", flag: "🇻🇳" },
  BD: { code: "BDT", symbol: "৳", rate: 1.31, name: "Bangladeshi Taka", flag: "🇧🇩" },
  PK: { code: "PKR", symbol: "Rs", rate: 3.33, name: "Pakistani Rupee", flag: "🇵🇰" },
  LK: { code: "LKR", symbol: "Rs", rate: 3.55, name: "Sri Lankan Rupee", flag: "🇱🇰" },
  NP: { code: "NPR", symbol: "Rs", rate: 1.6, name: "Nepalese Rupee", flag: "🇳🇵" },
  BR: { code: "BRL", symbol: "R$", rate: 0.06, name: "Brazilian Real", flag: "🇧🇷" },
  MX: { code: "MXN", symbol: "MX$", rate: 0.205, name: "Mexican Peso", flag: "🇲🇽" },
  ZA: { code: "ZAR", symbol: "R", rate: 0.217, name: "South African Rand", flag: "🇿🇦" },
  NG: { code: "NGN", symbol: "₦", rate: 18.5, name: "Nigerian Naira", flag: "🇳🇬" },
  EG: { code: "EGP", symbol: "E£", rate: 0.58, name: "Egyptian Pound", flag: "🇪🇬" },
  TR: { code: "TRY", symbol: "₺", rate: 0.39, name: "Turkish Lira", flag: "🇹🇷" },
  RU: { code: "RUB", symbol: "₽", rate: 1.06, name: "Russian Ruble", flag: "🇷🇺" },
  UA: { code: "UAH", symbol: "₴", rate: 0.49, name: "Ukrainian Hryvnia", flag: "🇺🇦" },
  PL: { code: "PLN", symbol: "zł", rate: 0.048, name: "Polish Zloty", flag: "🇵🇱" },
  CZ: { code: "CZK", symbol: "Kč", rate: 0.28, name: "Czech Koruna", flag: "🇨🇿" },
  SE: { code: "SEK", symbol: "kr", rate: 0.125, name: "Swedish Krona", flag: "🇸🇪" },
  NO: { code: "NOK", symbol: "kr", rate: 0.128, name: "Norwegian Krone", flag: "🇳🇴" },
  DK: { code: "DKK", symbol: "kr", rate: 0.082, name: "Danish Krone", flag: "🇩🇰" },
  CH: { code: "CHF", symbol: "CHF", rate: 0.0106, name: "Swiss Franc", flag: "🇨🇭" },
  NZ: { code: "NZD", symbol: "NZ$", rate: 0.02, name: "New Zealand Dollar", flag: "🇳🇿" },
  HK: { code: "HKD", symbol: "HK$", rate: 0.094, name: "Hong Kong Dollar", flag: "🇭🇰" },
  TW: { code: "TWD", symbol: "NT$", rate: 0.385, name: "Taiwan Dollar", flag: "🇹🇼" },
  IL: { code: "ILS", symbol: "₪", rate: 0.044, name: "Israeli Shekel", flag: "🇮🇱" },
  QA: { code: "QAR", symbol: "﷼", rate: 0.044, name: "Qatari Riyal", flag: "🇶🇦" },
  KW: { code: "KWD", symbol: "د.ك", rate: 0.0037, name: "Kuwaiti Dinar", flag: "🇰🇼" },
  BH: { code: "BHD", symbol: "BD", rate: 0.0045, name: "Bahraini Dinar", flag: "🇧🇭" },
  OM: { code: "OMR", symbol: "﷼", rate: 0.0046, name: "Omani Rial", flag: "🇴🇲" },
  KE: { code: "KES", symbol: "KSh", rate: 1.55, name: "Kenyan Shilling", flag: "🇰🇪" },
  GH: { code: "GHS", symbol: "₵", rate: 0.15, name: "Ghanaian Cedi", flag: "🇬🇭" },
  AR: { code: "ARS", symbol: "AR$", rate: 10.6, name: "Argentine Peso", flag: "🇦🇷" },
  CL: { code: "CLP", symbol: "CL$", rate: 11.3, name: "Chilean Peso", flag: "🇨🇱" },
  CO: { code: "COP", symbol: "COL$", rate: 49.4, name: "Colombian Peso", flag: "🇨🇴" },
  PE: { code: "PEN", symbol: "S/", rate: 0.045, name: "Peruvian Sol", flag: "🇵🇪" },
};

// Default fallback for unknown countries (show USD)
const DEFAULT_CURRENCY: CurrencyInfo = { code: "USD", symbol: "$", rate: 0.012, name: "US Dollar", flag: "🌍" };

interface CurrencyState {
  currency: CurrencyInfo;
  countryCode: string;
  isIndia: boolean;
  loading: boolean;
  formatPrice: (inrPrice: number) => string;
  getDisplayPrice: (inrPrice: number) => number;
  getInternationalPrice: (inrPrice: number) => number;
}

export const useCurrency = (): CurrencyState => {
  const [currency, setCurrency] = useState<CurrencyInfo>(CURRENCIES.IN);
  const [countryCode, setCountryCode] = useState("IN");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const code = data.country_code || "IN";
        setCountryCode(code);
        setCurrency(CURRENCIES[code] || DEFAULT_CURRENCY);
      } catch {
        // Default to India
        setCountryCode("IN");
        setCurrency(CURRENCIES.IN);
      } finally {
        setLoading(false);
      }
    };
    detectCountry();
  }, []);

  const isIndia = countryCode === "IN";

  // For international users: apply markup then convert
  const getInternationalPrice = (inrPrice: number): number => {
    if (isIndia) return inrPrice;
    return Math.round(inrPrice * INTERNATIONAL_MARKUP);
  };

  const getDisplayPrice = (inrPrice: number): number => {
    const effectiveInr = getInternationalPrice(inrPrice);
    if (isIndia) return effectiveInr;
    const converted = effectiveInr * currency.rate;
    // Round nicely
    if (converted < 1) return Math.round(converted * 100) / 100;
    if (converted < 100) return Math.round(converted * 10) / 10;
    return Math.round(converted);
  };

  const formatPrice = (inrPrice: number): string => {
    const price = getDisplayPrice(inrPrice);
    if (isIndia) return `₹${price.toLocaleString('en-IN')}`;
    return `${currency.symbol}${price.toLocaleString()}`;
  };

  return { currency, countryCode, isIndia, loading, formatPrice, getDisplayPrice, getInternationalPrice };
};
