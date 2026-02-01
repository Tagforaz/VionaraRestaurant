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

  // Load saved language on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage && savedLanguage !== i18n.language && languages.find(l => l.code === savedLanguage)) {
        i18n.changeLanguage(savedLanguage);
      }
    }
  }, [i18n]);

  const changeLanguage = async (lng: string) => {
    console.log('Changing language from', i18n.language, 'to', lng);
    
    // Prevent double clicks
    if (i18n.language === lng) return;
    
    try {
      // Change language
      await i18n.changeLanguage(lng);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', lng);
      }
      
      console.log('Language changed successfully to:', lng);
    } catch (error) {
      console.error('Error changing language:', error);
    }
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
            onSelect={(e) => {
              e.preventDefault();
              changeLanguage(language.code);
            }}
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
