/** Timestamp helpers. Demo "now" follows the real clock; formatted like seed data (YYYY-MM-DD HH:mm). */
export const nowStamp = () => new Date().toISOString().replace('T', ' ').slice(0, 16);
export const today = () => new Date().toISOString().slice(0, 10);
