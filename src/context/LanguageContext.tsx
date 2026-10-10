import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SupportedLanguage } from '../types';

interface LanguageContextType {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const translations: Record<SupportedLanguage, Record<string, string>> = {
  kn: {
    appTitle: 'ಶಾಲಾ ಫಲಿತಾಂಶ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ',
    appSubtitle: 'ಕರ್ನಾಟಕ ಶಾಲೆಗಳ ಫಲಿತಾಂಶ ವ್ಯವಸ್ಥೆ (ತರಗತಿ 1 ರಿಂದ 8)',
    mentorTitle: 'ಶ್ರೀ ಎಸ್. ಆರ್. ಅಂಗಡಿ',
    mentorRole: 'ವಿಜ್ಞಾನ ಶಿಕ್ಷಕರು, ಸರ್ಕಾರಿ ಮಾದರಿ ಪ್ರಾಥಮಿಕ ಶಾಲೆ, ನಿಂಗ್ಯಾನಟ್ಟಿ, ಬೆಳಗಾವಿ',
    badgeText: 'ತರಗತಿ 1 - 8 | ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪಠ್ಯಕ್ರಮ | ಸುರಕ್ಷಿತ • ವಿಶ್ವಾಸಾರ್ಹ',
    loginTab: 'ಲಾಗಿನ್',
    registerTab: 'ಹೊಸ ಶಾಲಾ ನೋಂದಣಿ',
    usernameLabel: 'ಬಳಕೆದಾರ ಹೆಸರು (11 ಅಂಕಿಗಳ ಡೈಸ್ ಕೋಡ್)',
    usernamePlaceholder: 'ನಿಮ್ಮ 11 ಅಂಕಿಗಳ UDISE/DISE ಕೋಡ್ ನಮೂದಿಸಿ',
    passwordLabel: 'ಪಾಸ್‌ವರ್ಡ್',
    passwordPlaceholder: 'ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ',
    loginBtn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಲಾಗಿನ್ ಆಗಿ',
    forgotPassword: 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರುವಿರಾ?',
    orDivider: 'ಅಥವಾ',
    buyPassKeyBtn: 'ಪಾಸ್ ಕೀ ಪಡೆಯಿರಿ / ₹500 ಪಾವತಿಸಿ',
    sendWhatsAppProof: 'ವಾಟ್ಸಾಪ್ ಮೂಲಕ ಪಾವತಿ ವಿವರ ಕಳುಹಿಸಿ',
    schoolName: 'ಶಾಲೆಯ ಹೆಸರು',
    schoolNamePlaceholder: 'ಶಾಲೆಯ ಪೂರ್ಣ ಹೆಸರು ನಮೂದಿಸಿ',
    diseCode: '11 ಅಂಕಿಗಳ ಡೈಸ್ ಕೋಡ್ (UDISE)',
    disePlaceholder: 'ಉದಾ: 29010100101',
    schoolType: 'ಶಾಲೆಯ ವಿಧ',
    schoolTypeGovt: 'ಸರ್ಕಾರಿ (Government)',
    schoolTypeAided: 'ಅನುದಾನಿತ (Aided)',
    schoolTypeUnaided: 'ಅನುದಾನರಹಿತ (Unaided)',
    hmName: 'ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು / ಮುಖ್ಯ ಶಿಕ್ಷಕರ ಹೆಸರು',
    hmPlaceholder: 'ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಹೆಸರು',
    mobile: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (10 ಅಂಕಿಗಳು)',
    mobilePlaceholder: '94815XXXXX',
    email: 'ಇಮೇಲ್ ವಿಳಾಸ',
    emailPlaceholder: 'school@example.com',
    confirmPassword: 'ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ',
    confirmPasswordPlaceholder: 'ಪಾಸ್‌ವರ್ಡ್ ಅನ್ನು ಪುನಃ ನಮೂದಿಸಿ',
    registerBtn: 'ಶಾಲೆಯನ್ನು ನೋಂದಾಯಿಸಿ',
    pendingHeading: 'ನಿಮ್ಮ ಶಾಲಾ ನೋಂದಣಿ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ (ಬಾಕಿ ಇದೆ)',
    pendingMessage: 'ನಿಮ್ಮ ನೋಂದಣಿಯು ಪಾವತಿ ದೃಢೀಕರಣ ಮತ್ತು ನಿರ್ವಾಹಕರ ಅನುಮೋದನೆಗಾಗಿ ಬಾಕಿ ಉಳಿದಿದೆ. ₹500 ಪಾಸ್ ಕೀ ಶುಲ್ಕವನ್ನು ಪಾವತಿಸಿ, ಪಾವತಿಯ ವಿವರ ಅಥವಾ ರಶೀದಿಯನ್ನು ವಾಟ್ಸಾಪ್ ಮೂಲಕ ಕಳುಹಿಸಿ.',
    approvedHeading: 'ಶಾಲಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    adminPortal: 'ನಿರ್ವಾಹಕರ ಪೋರ್ಟಲ್',
    logout: 'ಲಾಗ್ ಔಟ್',
    securityHighlights: 'ಸುರಕ್ಷತಾ ಮಾನದಂಡಗಳು',
    sec1: 'ಸುರಕ್ಷಿತ ಅಧಿಕೃತ ಲಾಗಿನ್',
    sec2: 'ನಿಮ್ಮ ಶಾಲೆಯ ಮಾಹಿತಿ ಸಂಪೂರ್ಣ ಸುರಕ್ಷಿತ',
    sec3: 'ಅಧಿಕೃತ ಶಾಲೆಗಳಿಗೆ ಮಾತ್ರ ಪ್ರವೇಶಾವಕಾಶ',
    sec4: 'ನಿರಂತರ ಇಲಾಖಾ ಮಾನದಂಡಗಳ ಅಪ್‌ಡೇಟ್‌ಗಳು',
    sec5: 'ವಾಟ್ಸಾಪ್ ಮೂಲಕ ತಕ್ಷಣದ ಬೆಂಬಲ',
    featuresTitle: 'ವ್ಯವಸ್ಥೆಯ ಮುಖ್ಯ ಸೌಲಭ್ಯಗಳು',
    feat1: 'ಅಂಕಗಳ ನಮೂದು (FA1, FA2, SA1, FA3, FA4, SA2)',
    feat2: 'ಸ್ವಯಂಚಾಲಿತ ನಿಖರ ಫಲಿತಾಂಶ ತಯಾರಿಕೆ',
    feat3: 'ವಿದ್ಯಾರ್ಥಿ ಮಾಹಿತಿ ನಿರ್ವಹಣೆ',
    feat4: 'ತರಗತಿವಾರು ಮತ್ತು ವಿಷಯವಾರು ವರದಿಗಳು',
    feat5: 'ಮುದ್ರಿಸಬಹುದಾದ ಸುಂದರ ಮಾರ್ಕ್ಸ್ ಕಾರ್ಡ್ & PDF',
    feat6: 'ಲಿಂಗ ಮತ್ತು ಜಾತಿವಾರು ವಿಶ್ಲೇಷಣಾ ವರದಿಗಳು',
    feat7: 'ಸುರಕ್ಷಿತ ಕ್ಲೌಡ್ ಶೇಖರಣೆ',
    feat8: 'ಮೊಬೈಲ್, ಲ್ಯಾಪ್‌ಟಾಪ್ ಮತ್ತು ಕಂಪ್ಯೂಟರ್ ಬೆಂಬಲ',
    paymentMethods: 'ಬೆಂಬಲಿತ ಪಾವತಿ ಮಾಧ್ಯಮಗಳು:',
    manualVerificationNote: 'ಗಮನಿಸಿ: ಪಾವತಿ ಮಾಡಿದ ನಂತರ ವಾಟ್ಸಾಪ್ ಮೂಲಕ ದೃಢೀಕರಿಸಿ, ನಿರ್ವಾಹಕರು ಖಾತೆಯನ್ನು ಸಕ್ರಿಯಗೊಳಿಸುತ್ತಾರೆ.',
    statusPending: 'ಬಾಕಿ ಇದೆ (PENDING)',
    statusApproved: 'ಅನುಮೋದಿಸಲಾಗಿದೆ (APPROVED)',
    statusSuspended: 'ಅಮಾನತುಗೊಳಿಸಲಾಗಿದೆ (SUSPENDED)',
    statusExpired: 'ಅವಧಿ ಮುಗಿದಿದೆ (EXPIRED)',
    statusRejected: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ (REJECTED)',
  },
  en: {
    appTitle: 'SCHOOL RESULT MANAGEMENT SYSTEM',
    appSubtitle: 'Result Management System for Karnataka Schools (Classes 1 to 8)',
    mentorTitle: 'BY SHRI. S R ANGADI',
    mentorRole: 'Science Teacher, Govt KHPS Ningyanatti, Belagavi',
    badgeText: 'Classes 1 - 8 | Karnataka State Syllabus | Safe • Secure • Reliable',
    loginTab: 'Login',
    registerTab: 'New School Registration',
    usernameLabel: 'Username (11 Digit DISE Code)',
    usernamePlaceholder: 'Enter your 11 digit DISE Code',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    loginBtn: 'Login to Dashboard',
    forgotPassword: 'Forgot Password?',
    orDivider: 'OR',
    buyPassKeyBtn: '🛒 Buy Pass Key / Pay ₹500',
    sendWhatsAppProof: 'Send Payment Proof on WhatsApp',
    schoolName: 'School Name',
    schoolNamePlaceholder: 'Enter full registered school name',
    diseCode: '11 Digit DISE/UDISE Code',
    disePlaceholder: 'e.g. 29010100101',
    schoolType: 'School Type',
    schoolTypeGovt: 'Government',
    schoolTypeAided: 'Aided',
    schoolTypeUnaided: 'Unaided',
    hmName: 'Headmaster / Administrator Name',
    hmPlaceholder: 'Enter Headmaster / In-charge name',
    mobile: 'Mobile Number (10 Digits)',
    mobilePlaceholder: '94815XXXXX',
    email: 'Official Email Address',
    emailPlaceholder: 'school@example.com',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Re-enter your password',
    registerBtn: 'Submit School Registration',
    pendingHeading: 'Your Registration is Pending Approval',
    pendingMessage: 'Your registration is pending payment confirmation and administrator approval. Please complete the ₹500 pass key fee and send your transaction proof via WhatsApp for swift activation.',
    approvedHeading: 'School Dashboard',
    adminPortal: 'Administrator Portal',
    logout: 'Logout',
    securityHighlights: 'Security Highlights',
    sec1: 'Secure Login & Isolated Data',
    sec2: 'Your School Data is 100% Safe',
    sec3: 'Only Authorised Schools Allowed',
    sec4: 'Regular Karnataka Board Updates',
    sec5: 'Direct WhatsApp Teacher Support',
    featuresTitle: 'System Capabilities & Modules',
    feat1: 'Comprehensive Marks Entry (FA & SA)',
    feat2: 'Instant & Accurate Result Generation',
    feat3: 'Class 1–8 Student Database',
    feat4: 'Class & Subject-wise Statistical Reports',
    feat5: 'Official Marks Card & PDF Printing',
    feat6: 'Gender & Caste Wise Analysis',
    feat7: 'Secure Encrypted Cloud Storage',
    feat8: 'Works Seamlessly on Mobile & PC',
    paymentMethods: 'Supported UPI Payment Channels:',
    manualVerificationNote: 'Payment Verification: Manual verification by Shri S R Angadi upon receipt of WhatsApp proof.',
    statusPending: 'PENDING',
    statusApproved: 'APPROVED',
    statusSuspended: 'SUSPENDED',
    statusExpired: 'EXPIRED',
    statusRejected: 'REJECTED',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem('kseab_lang') as SupportedLanguage) || 'kn';
  });

  const setLang = (newLang: SupportedLanguage) => {
    setLangState(newLang);
    localStorage.setItem('kseab_lang', newLang);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
