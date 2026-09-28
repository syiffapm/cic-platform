import { useEffect, useMemo, useState } from 'react';
import { GeoJSON, MapContainer, useMap } from 'react-leaflet';
import { feature } from 'topojson-client';
import 'leaflet/dist/leaflet.css';

const BOUNDS = [[9.7, 92.2], [28.5, 101.2]];
const cache = {};

const TOPO = { 'myanmar-townships.json': ['myanmar-townships.topo.json', 'townships'], 'myanmar-regions.json': ['myanmar-regions.topo.json', 'regions'] };

/** Loads boundaries once per session. Shipped as quantized TopoJSON (~30% smaller) and expanded to GeoJSON here. */
export function useGeo(file) {
  const [data, setData] = useState(cache[file] ?? null);
  useEffect(() => {
    if (cache[file]) return;
    const [topoFile, object] = TOPO[file] ?? [file, null];
    fetch(`/geo/${topoFile}`).then((r) => r.json())
      .then((t) => (object ? feature(t, t.objects[object]) : t))
      .then((g) => { cache[file] = g; setData(g); })
      .catch(() => setData(null));
  }, [file]);
  return data;
}

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

/**
 * Township choropleth: every township polygon is shaded by `colorFor(properties)`, so within one
 * state a township with more activity is darker than its neighbours. State / region borders are drawn
 * on top as a thin outline. `inScope(properties)` greys out townships outside the user's regional scope.
 */
export default function TownshipMap({ features, colorFor, label, onSelect, selected, inScope = () => true, height = 560 }) {
  const regions = useGeo('myanmar-regions.json');
  const data = useMemo(() => (features ? { type: 'FeatureCollection', features } : null), [features]);

  const style = (f) => {
    const p = f.properties;
    const on = inScope(p);
    return {
      color: selected === p.name ? '#1f3551' : '#ffffff',
      weight: selected === p.name ? 2.5 : 0.4,
      fillColor: on ? colorFor(p) : '#e2e8f0',
      fillOpacity: on ? 0.95 : 0.6,
    };
  };

  const onEach = (f, layer) => {
    const p = f.properties;
    layer.bindTooltip(`<b>${p.name}</b> · ${p.region}<br/>${label(p)}`, { sticky: true });
    if (onSelect && inScope(p)) {
      layer.on('click', () => onSelect(p));
      layer.on('mouseover', () => layer.setStyle({ weight: 2, color: '#1f3551' }));
      layer.on('mouseout', () => layer.setStyle(style(f)));
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200" style={{ height }}>
      <MapContainer bounds={BOUNDS} zoomSnap={0.1} zoomDelta={0.5} scrollWheelZoom={false} className="h-full w-full" style={{ background: '#eef2f7' }} attributionControl={false}>
        <FitCountry />
        {data && <GeoJSON key={`${selected}-${features.length}-${colorFor.key ?? ''}`} data={data} style={style} onEachFeature={onEach} />}
        {regions && <GeoJSON key="regions" data={regions} interactive={false} style={{ color: '#475569', weight: 1.1, fill: false }} />}
      </MapContainer>
      <p className="pointer-events-none absolute bottom-1 right-2 z-[400] text-[11px] text-slate-500">Boundaries: geoBoundaries (CC BY 4.0)</p>
    </div>
  );
}
