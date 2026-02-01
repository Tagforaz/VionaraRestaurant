import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import az from './locales/az.json';
import ru from './locales/ru.json';

// Get saved language from localStorage, with fallback handling
const getInitialLanguage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('language') || 'az';
  }
  return 'az';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      az: { translation: az },
      ru: { translation: ru },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    // Enable debug mode to help identify missing translations
    debug: process.env.NODE_ENV === 'development',
  });

// Listen for language changes and update the HTML lang attribute
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
});

export default i18n;
