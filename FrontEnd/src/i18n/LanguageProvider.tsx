import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChange = (language: string) => {
      setCurrentLanguage(language);
      setIsLoading(false);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const changeLanguage = async (language: string) => {
    if (language === currentLanguage) return;
    
    setIsLoading(true);
    
    try {
      await i18n.changeLanguage(language);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', language);
      }
      
      console.log('Language successfully changed to:', language);
    } catch (error) {
      console.error('Failed to change language:', error);
      setIsLoading(false);
    }
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      changeLanguage,
      isLoading
    }}>
      {children}
    </LanguageContext.Provider>
  );
};