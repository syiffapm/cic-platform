/** Flatten nested i18n objects to dotted keys: { common: { save } } → { 'common.save': 'Save' } */
export function flatten(obj, prefix = '', out = {}) {
  Object.entries(obj ?? {}).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else out[key] = v;
  });
  return out;
}

/** Rebuild a nested object from dotted keys. */
export function unflatten(flat) {
  const out = {};
  Object.entries(flat).forEach(([key, value]) => {
    const parts = key.split('.');
    let node = out;
    parts.slice(0, -1).forEach((p) => { node[p] = node[p] ?? {}; node = node[p]; });
    node[parts[parts.length - 1]] = value;
  });
  return out;
}

export function downloadJson(filename, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
