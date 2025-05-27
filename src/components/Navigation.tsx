
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Pickaxe, 
  Crown, 
  Wallet, 
  CheckSquare, 
  Users
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const tabs = [
    { id: 'mining', icon: Pickaxe, label: t('mining') },
    { id: 'cards', icon: Crown, label: t('cards') },
    { id: 'wallet', icon: Wallet, label: t('wallet') },
    { id: 'tasks', icon: CheckSquare, label: t('tasks') },
    { id: 'referral', icon: Users, label: t('referral') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 nav-glow p-3">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              variant="ghost"
              size="sm"
              className={`
                relative flex flex-col items-center gap-1 h-auto py-3 px-2 rounded-2xl
                transition-all duration-300 ease-in-out transform
                ${isActive 
                  ? 'bg-gradient-to-t from-purple-600/30 to-blue-600/30 text-white scale-105 shadow-lg border border-white/30' 
                  : 'text-white/70 hover:text-white hover:bg-white/10 hover:scale-105'
                }
                backdrop-blur-sm
              `}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-purple-500/20 to-blue-500/20 animate-pulse" />
              )}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'drop-shadow-lg' : ''}`} />
                <span className={`text-xs leading-none font-medium transition-all duration-300 ${isActive ? 'drop-shadow-sm' : ''}`}>
                  {tab.label}
                </span>
              </div>
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full shadow-glow" />
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
};
