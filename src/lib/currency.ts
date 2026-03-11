/**
 * Currency utilities for multi-currency pricing
 * Supports INR (India) and USD (International)
 */

export type Currency = "INR" | "USD";

export interface PricingData {
  currency: Currency;
  symbol: string;
  prices: {
    basic: { monthly: number; yearly: number };
    pro: { monthly: number; yearly: number };
    elite: { monthly: number; yearly: number };
  };
  originalPrices: {
    basic: { monthly: number; yearly: number };
    pro: { monthly: number; yearly: number };
    elite: { monthly: number; yearly: number };
  };
  addChildPrice: number;
}

// Pricing configuration
const PRICING_CONFIG: Record<Currency, PricingData> = {
  INR: {
    currency: "INR",
    symbol: "₹",
    prices: {
      basic: { monthly: 99, yearly: 999 },
      pro: { monthly: 299, yearly: 2999 },
      elite: { monthly: 399, yearly: 3999 },
    },
    originalPrices: {
      basic: { monthly: 149, yearly: 1490 },
      pro: { monthly: 399, yearly: 3990 },
      elite: { monthly: 599, yearly: 5990 },
    },
    addChildPrice: 99,
  },
  USD: {
    currency: "USD",
    symbol: "$",
    prices: {
      basic: { monthly: 3, yearly: 14 },
      pro: { monthly: 5, yearly: 40 },
      elite: { monthly: 7, yearly: 55 },
    },
    originalPrices: {
      basic: { monthly: 5, yearly: 20 },
      pro: { monthly: 8, yearly: 55 },
      elite: { monthly: 10, yearly: 75 },
    },
    addChildPrice: 2,
  },
};

/**
 * Detect user's country using multiple methods
 * Returns "IN" for India, "OTHER" for all other countries
 */
export async function detectUserCountry(): Promise<"IN" | "OTHER"> {
  try {
    // Method 1: Try Cloudflare headers (if using Cloudflare)
    if (typeof window === "undefined") {
      // Server-side detection would go here
      return "OTHER";
    }

    // Method 2: Use a free IP geolocation API
    const response = await fetch("https://ipapi.co/json/", {
      cache: "force-cache",
    });

    if (response.ok) {
      const data = await response.json();
      return data.country_code === "IN" ? "IN" : "OTHER";
    }

    // Fallback: Default to international
    return "OTHER";
  } catch (error) {
    console.error("Error detecting country:", error);
    // Fallback: Default to international
    return "OTHER";
  }
}

/**
 * Get pricing data based on user's country
 */
export function getPricingData(country: "IN" | "OTHER"): PricingData {
  return country === "IN" ? PRICING_CONFIG.INR : PRICING_CONFIG.USD;
}

/**
 * Get currency based on user's country
 */
export function getCurrency(country: "IN" | "OTHER"): Currency {
  return country === "IN" ? "INR" : "USD";
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: Currency): string {
  const config = PRICING_CONFIG[currency];
  return `${config.symbol}${amount}`;
}
