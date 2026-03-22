import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';

export type TranslationKey = keyof (typeof translations)['en'];

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = (key: string, replacements?: { [key: string]: string | number }): string => {
    // FIX: Coerce initial value to a string to prevent type inference issues.
    // This ensures `translation` is always a string, fixing errors on `.replace()` and the return type.
    let translation = String(translations[language]?.[key] || translations['en'][key] || key);
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        translation = translation.replace(new RegExp(`{{${placeholder}}}`, 'g'), String(value));
      });
    }
    return translation;
  };

  return { t, language };
};