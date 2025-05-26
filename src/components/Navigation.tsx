
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Pickaxe, 
  Crown, 
  Wallet, 
  CheckSquare, 
  Users, 
  Settings 
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
    { id: 'admin', icon: Settings, label: t('admin') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/20 p-2">
      <div className="max-w-md mx-auto grid grid-cols-6 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 h-auto py-2 px-1 ${
                isActive 
                  ? 'text-princess-pink bg-princess-pink/20' 
                  : 'text-gray-600 hover:text-princess-pink hover:bg-princess-pink/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs leading-none">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};
