
import React, { useState, useEffect } from 'react';
import { MiningDashboard } from '@/components/MiningDashboard';
import { PrincessCards } from '@/components/PrincessCards';
import { WalletSection } from '@/components/WalletSection';
import { TasksPage } from '@/components/TasksPage';
import { ReferralPage } from '@/components/ReferralPage';
import { AdminPanel } from '@/components/AdminPanel';
import { Navigation } from '@/components/Navigation';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('mining');
  const { t } = useLanguage();

  const handleAdminAccess = () => {
    setActiveTab('admin');
  };

  return (
    <div className="min-h-screen bg-princess-gradient sparkle-bg relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-princess-pink/5 via-transparent to-princess-purple/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,107,157,0.1),transparent)] animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(166,99,204,0.1),transparent)] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Header */}
      <header className="relative z-10 p-4 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="/lovable-uploads/52649dfd-4d2c-4a70-89ec-dacd9a5e0c69.png" 
                alt="SHROUK Logo" 
                className="w-10 h-10 animate-pulse drop-shadow-lg"
              />
              <div className="absolute inset-0 bg-princess-gold/20 rounded-full animate-ping" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-princess-pink via-princess-purple to-princess-gold bg-clip-text text-transparent drop-shadow-sm">
                SHROUK Mining
              </h1>
              <p className="text-xs text-white/80 font-medium">Princess Mining Bot</p>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 pb-20 relative z-10">
        {activeTab === 'mining' && <MiningDashboard />}
        {activeTab === 'cards' && <PrincessCards />}
        {activeTab === 'wallet' && <WalletSection />}
        {activeTab === 'tasks' && <TasksPage onAdminAccess={handleAdminAccess} />}
        {activeTab === 'referral' && <ReferralPage />}
        {activeTab === 'admin' && <AdminPanel />}
      </main>

      {/* Bottom Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Enhanced Floating Sparkles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(8)].map((_, i) => (
          <Sparkles
            key={i}
            className="absolute text-princess-gold opacity-40 animate-sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              fontSize: `${Math.random() * 15 + 8}px`,
              filter: 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.5))'
            }}
          />
        ))}
      </div>

      {/* Additional decorative elements */}
      <div className="fixed bottom-10 left-5 w-20 h-20 bg-princess-pink/10 rounded-full blur-xl animate-pulse pointer-events-none" />
      <div className="fixed top-20 right-5 w-16 h-16 bg-princess-purple/10 rounded-full blur-xl animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
    </div>
  );
};

export default Index;
