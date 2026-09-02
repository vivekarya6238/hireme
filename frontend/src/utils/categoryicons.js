import {
  Briefcase,
  Package,
  Store,
  Sprout,
  HardHat,
  SprayCan,
  ChefHat,
  Truck,
  PartyPopper,
  ShieldCheck,
} from "lucide-react";

// maps a category's namekey to a consistent vector icon
// falls back to Briefcase for anything not mapped yet (new admin-added categories)
const categoryicons = {
  "cat.helper": Briefcase,
  "cat.loader": Package,
  "cat.shopassistant": Store,
  "cat.farmwork": Sprout,
  "cat.construction": HardHat,
  "cat.cleaning": SprayCan,
  "cat.cooking": ChefHat,
  "cat.driver": Truck,
  "cat.eventwork": PartyPopper,
  "cat.security": ShieldCheck,
};

export function getCategoryIcon(namekey) {
  return categoryicons[namekey] || Briefcase;
}

export default categoryicons;