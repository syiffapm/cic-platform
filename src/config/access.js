/**
 * Entry points are split by audience: citizens sign in on the public website, staff of CIC, the
 * Central Bank and licensed institutions sign in through the separate staff workspace.
 *
 * In production the workspace runs on its own host (e.g. workspace.cic.gov.mm). Set
 * VITE_STAFF_ORIGIN / VITE_PUBLIC_ORIGIN to enforce that split between two deployed hosts.
 */
export const CITIZEN_LOGIN = '/login';
export const STAFF_HOME = '/workspace';
export const STAFF_LOGIN = '/workspace/login';

export const STAFF_PORTALS = ['mfi', 'gov', 'regulator', 'admin'];
export const loginPathFor = (portal) => (STAFF_PORTALS.includes(portal) ? STAFF_LOGIN : CITIZEN_LOGIN);

export const STAFF_ORIGIN = import.meta.env.VITE_STAFF_ORIGIN || '';
export const PUBLIC_ORIGIN = import.meta.env.VITE_PUBLIC_ORIGIN || '';

const STAFF_PATH = /^\/(workspace|mfi|gov|regulator|admin)(\/|$)/;
export const isStaffPath = (pathname) => STAFF_PATH.test(pathname);
