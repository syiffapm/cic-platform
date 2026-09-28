import { INSTITUTIONS } from '@/data/institutions';


export const mfiName = (id) => INSTITUTIONS.find((i) => i.id === id)?.name ?? id;
export const mfiShort = (id) => INSTITUTIONS.find((i) => i.id === id)?.short ?? id;

export { RULE_VERSION, DATA_AS_OF, buildReport, GRADE_TONES } from '@/lib/creditScore';
