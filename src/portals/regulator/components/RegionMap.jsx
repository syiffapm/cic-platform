import { useEffect, useMemo } from 'react';
import { GeoJSON, MapContainer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeo } from './TownshipMap';

const BOUNDS = [[9.7, 92.2], [28.5, 101.2]];

/** Keeps the whole country in view when the card resizes. */
function FitCountry() {
  const map = useMap();
  useEffect(() => {
    const fit = () => map.fitBounds(BOUNDS, { padding: [8, 8] });
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}
/** Nay Pyi Taw is administered inside the Mandalay polygon of the boundary file. */
const POLYGON_OF = { 'Nay Pyi Taw': 'Mandalay' };

const useRegionsGeo = () => useGeo('myanmar-regions.json');

/** Borrower-weighted roll-up of township aggregates into one object per state / region polygon. */
export function aggregateByRegion(townships) {
  const out = {};
  townships.forEach((t) => {
    const key = POLYGON_OF[t.region] ?? t.region;
    const a = (out[key] ??= { region: key, borrowers: 0, portfolio: 0, multi: 0, highDti: 0, w: { par30: 0, womenPct: 0, avgLoan: 0 }, townships: 0 });
    a.borrowers += t.borrowers; a.portfolio += t.portfolio; a.multi += t.multi; a.highDti += t.highDti; a.townships += 1;
    Object.keys(a.w).forEach((k) => { a.w[k] += t[k] * t.borrowers; });
  });
  return Object.fromEntries(Object.values(out).map((a) => [a.region, {
    region: a.region, name: a.region, borrowers: a.borrowers, portfolio: Math.round(a.portfolio * 10) / 10, multi: a.multi, highDti: a.highDti, townships: a.townships,
    par30: Math.round((a.w.par30 / a.borrowers) * 10) / 10, womenPct: Math.round(a.w.womenPct / a.borrowers), avgLoan: Math.round(a.w.avgLoan / a.borrowers),
  }]));
}

/**
 * Regional heat-map on a real map of Myanmar: each state / region is shaded with
 * `regionTone(aggregate)`; `regionMetric(aggregate)` feeds the hover label. Clicking a region calls
 * `onRegionSelect(name)`. `dimmed(t)` leaves townships out of the roll-up (filters, regional scope).
 */
export default function RegionMap({ townships, regionTone, regionMetric, onRegionSelect, selectedRegion, dimmed = () => false, height = 540 }) {
  const geo = useRegionsGeo();
  const regions = useMemo(() => aggregateByRegion(townships.filter((t) => !dimmed(t))), [townships, dimmed]);

  const styleFor = (feature) => {
    const name = feature.properties.name;
    const agg = regions[name];
    const isSel = selectedRegion && (POLYGON_OF[selectedRegion] ?? selectedRegion) === name;
    if (!agg) return { color: '#94a3b8', weight: 0.8, fillColor: '#ffffff', fillOpacity: 0.9 };
    return { color: isSel ? '#1f3551' : '#ffffff', weight: isSel ? 3 : 1.2, fillColor: regionTone(agg).bg, fillOpacity: 0.9 };
  };

  const onEachRegion = (feature, layer) => {
    const name = feature.properties.name;
    const agg = regions[name];
    const label = agg
      ? `<b>${name}</b><br/>${regionMetric ? `${regionMetric(agg)}<br/>` : ''}${agg.townships} reporting township${agg.townships > 1 ? 's' : ''} · ${agg.borrowers.toLocaleString()} borrowers`
      : `<b>${name}</b><br/>No reporting township in view`;
    layer.bindTooltip(label, { sticky: true });
    if (agg && onRegionSelect) {
      layer.on('click', () => onRegionSelect(name));
      layer.on('mouseover', () => layer.setStyle({ weight: 2.5, color: '#1f3551' }));
      layer.on('mouseout', () => layer.setStyle(styleFor(feature)));
    }
  };

  const key = JSON.stringify(Object.values(regions).map((r) => [r.region, r.par30, r.borrowers])) + (selectedRegion ?? '');
  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200" style={{ height }}>
      <MapContainer bounds={BOUNDS} zoomSnap={0.1} zoomDelta={0.5} scrollWheelZoom={false} className="h-full w-full" style={{ background: '#eef2f7' }} attributionControl={false}>
        <FitCountry />
        {geo && <GeoJSON key={key} data={geo} style={styleFor} onEachFeature={onEachRegion} />}
      </MapContainer>
      <p className="pointer-events-none absolute bottom-1 right-2 z-[400] text-[11px] text-slate-500">Boundaries: geoBoundaries (CC BY 4.0)</p>
    </div>
  );
}
