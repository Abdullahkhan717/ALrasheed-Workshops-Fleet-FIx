
import { translations } from './translations';

const enKeys = Object.keys(translations.en);
const arKeys = Object.keys(translations.ar);

const missingInAr = enKeys.filter(key => !arKeys.includes(key));
const missingInEn = arKeys.filter(key => !enKeys.includes(key));

console.log('Missing in Arabic:', missingInAr);
console.log('Missing in English:', missingInEn);
