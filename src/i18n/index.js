import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ta from './locales/ta.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import bn from './locales/bn.json';
import mr from './locales/mr.json';
import gu from './locales/gu.json';

export const resources = {
  en: { translation: en },
  ta: { translation: ta },
  hi: { translation: hi },
  te: { translation: te },
  kn: { translation: kn },
  ml: { translation: ml },
  bn: { translation: bn },
  mr: { translation: mr },
  gu: { translation: gu }
};

export const supportedLanguages = [
  { code: 'en', label: 'English', brandName: 'Entitle AI', fontClass: 'font-sans' },
  { code: 'ta', label: 'தமிழ்', brandName: 'என்டைட்டில் AI', fontClass: 'font-tamil' },
  { code: 'hi', label: 'हिन्दी', brandName: 'एंटाइटल AI', fontClass: 'font-hindi' },
  { code: 'te', label: 'తెలుగు', brandName: 'ఎంటైటిల్ AI', fontClass: 'font-sans' },
  { code: 'kn', label: 'ಕನ್ನಡ', brandName: 'ಎಂಟೈಟಲ್ AI', fontClass: 'font-sans' },
  { code: 'ml', label: 'മലയാളം', brandName: 'എൻടൈറ്റിൽ AI', fontClass: 'font-sans' },
  { code: 'bn', label: 'বাংলা', brandName: 'এনটাইটেল AI', fontClass: 'font-sans' },
  { code: 'mr', label: 'मराठी', brandName: 'एन्टायटल AI', fontClass: 'font-sans' },
  { code: 'gu', label: 'ગુજરાતી', brandName: 'એન્ટાઇટલ AI', fontClass: 'font-sans' }
];

// Default language is English (Default language) as requested
const savedLang = localStorage.getItem('entitle_lang') || localStorage.getItem('urimai_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('entitle_lang', lng);
  document.documentElement.lang = lng;
});

export default i18n;
