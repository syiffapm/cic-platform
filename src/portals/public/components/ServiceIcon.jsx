import {
  BarChart3, BellRing, Building2, FileSearch, FileStack, FileText, Gauge, GraduationCap, HelpCircle,
  Landmark, QrCode, Scale, ShieldCheck, Smartphone, Upload, UserCheck,
} from 'lucide-react';

/** Explicit map so only the icons we use are bundled (services.js stores icon names). */
const ICONS = { BarChart3, BellRing, Building2, FileSearch, FileStack, FileText, Gauge, GraduationCap, Landmark, QrCode, Scale, ShieldCheck, Smartphone, Upload, UserCheck };

export default function ServiceIcon({ name, className = 'h-5 w-5' }) {
  const Icon = ICONS[name] ?? HelpCircle;
  return <Icon className={className} aria-hidden="true" />;
}
