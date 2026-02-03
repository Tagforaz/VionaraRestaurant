import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  // Load saved language on component mount only once
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage && savedLanguage !== i18n.language && languages.find(l => l.code === savedLanguage)) {
        i18n.changeLanguage(savedLanguage);
      }
    }
  }, []); // Empty dependency array - run only once on mount

  const changeLanguage = (lng: string) => {
    // Prevent changing to same language
    if (i18n.language === lng) return;
    
    // Save to localStorage first
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lng);
    }
    
    // Then change language
    i18n.changeLanguage(lng);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <span className="text-xl">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={cn(
              "cursor-pointer flex items-center gap-2 px-3 py-2",
              i18n.language === language.code ? 'bg-accent text-accent-foreground' : ''
            )}
          >
            <span className="text-lg">{language.flag}</span>
            <span className="font-medium">{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
