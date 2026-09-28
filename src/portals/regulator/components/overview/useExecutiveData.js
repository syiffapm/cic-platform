import { useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { KPI_DICTIONARY, PORTFOLIO_BY_REGION, SECTOR_TREND } from '@/data/kpis';
import { TOWNSHIP_STATS } from '../../data/townships';
import { useRegulator } from '../../lib/RegulatorStore';
import { round } from '../../lib/util';
import { slaState } from '../common';

export const DEFAULT_FILTERS = { period: '12m', region: '', tier: '', product: '' };
const PERIOD_MONTHS = { '3m': 3, '6m': 6, '12m': 12 };
const kv = (id) => KPI_DICTIONARY.find((k) => k.id === id).value;

const weighted = (rows, key, w = 'portfolio') => {
  const tw = rows.reduce((s, r) => s + r[w], 0);
  return tw ? rows.reduce((s, r) => s + r[key] * r[w], 0) / tw : 0;
};

/**
 * Applies the Overview filter bar (GOV-02) to sector aggregates. Region scales via township shares,
 * tier/product via the Institution Master; the two shares combine multiplicatively (independence
 * assumption acceptable for the prototype — the DWH answers this with a real cube query).
 */
export default function useExecutiveData(filters) {
  const { institutions, disputes } = useStore();
  const { alerts } = useRegulator();

  return useMemo(() => {
    const active = institutions.filter((i) => i.status !== 'Revoked' && i.portfolio > 0);
    const totalPortfolio = active.reduce((s, i) => s + i.portfolio, 0);

    const instMatch = active.filter((i) => (!filters.tier || i.tier === filters.tier) && (!filters.product || i.products.includes(filters.product)));
    const scopeInst = instMatch.filter((i) => !filters.region || i.region === filters.region || i.tier === 'Tier 1');
    const instShare = instMatch.reduce((s, i) => s + i.portfolio, 0) / totalPortfolio;

    const towns = TOWNSHIP_STATS.filter((t) => !filters.region || t.region === filters.region);
    const townTotal = TOWNSHIP_STATS.reduce((s, t) => s + t.portfolio, 0);
    const regionShare = towns.reduce((s, t) => s + t.portfolio, 0) / townTotal;
    const share = instShare * regionShare;

    const instPar = weighted(instMatch, 'par30');
    const townPar = weighted(towns, 'par30');
    const par30Raw = filters.region && (filters.tier || filters.product) ? (instPar + townPar) / 2 : filters.region ? townPar : instMatch.length ? instPar : 0;
    const par30 = round(filters.region || filters.tier || filters.product ? par30Raw : kv('par30'));
    const nplRatio = kv('npl') / kv('par30');

    const scopeIds = new Set(scopeInst.map((i) => i.id));
    const openDisputes = disputes.filter((d) => scopeIds.has(d.mfiId) && !['Resolved', 'Closed', 'Rejected'].includes(d.status));
    const overIndebted = Math.round(towns.reduce((s, t) => s + t.multi + t.highDti * 0.55, 0) * instShare);

    const kpis = {
      reporting: scopeInst.filter((i) => i.onTime >= 75).length,
      licensed: scopeInst.length,
      borrowers: Math.round(kv('borrowers') * share),
      portfolio: kv('portfolio') * share,
      par30,
      npl: round(par30 * nplRatio),
      overIndebted,
      disputesOpen: openDisputes.length,
    };

    const months = PERIOD_MONTHS[filters.period];
    const trend = SECTOR_TREND.slice(-months).map((m) => ({
      month: m.month,
      portfolio: Math.round(m.portfolio * share),
      par30: round(Math.max(0.3, m.par30 + (par30 - kv('par30')))),
    }));

    const byArea = filters.region
      ? towns.map((t) => ({ name: t.name, portfolio: round(t.portfolio * instShare), par30: t.par30 }))
      : PORTFOLIO_BY_REGION.map((r) => ({ name: r.region, portfolio: Math.round(r.portfolio * instShare), par30: r.par30 }));

    const topRisk = [...scopeInst].sort((a, b) => b.par30 - a.par30).slice(0, 6);

    const scopedAlerts = alerts.filter((a) => scopeIds.has(a.mfiId) && !['Dismissed'].includes(a.status));
    const alertSummary = ['Critical', 'High', 'Medium', 'Low'].map((sev) => ({
      severity: sev,
      open: scopedAlerts.filter((a) => a.severity === sev && a.status !== 'Case open').length,
      inCase: scopedAlerts.filter((a) => a.severity === sev && a.status === 'Case open').length,
    }));

    const sla = { ok: 0, risk: 0, breached: 0 };
    openDisputes.forEach((d) => {
      const s = slaState(d.dueAt);
      sla[d.status === 'Escalated' || s.key === 'breached' ? 'breached' : s.key === 'risk' ? 'risk' : 'ok'] += 1;
    });

    return { kpis, trend, byArea, topRisk, alertSummary, sla, towns, share };
  }, [institutions, disputes, alerts, filters]);
}
