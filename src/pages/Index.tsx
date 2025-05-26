
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
import { Sparkles, Crown } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('mining');
  const { t } = useLanguage();

  const handleAdminAccess = () => {
    setActiveTab('admin');
  };

  return (
    <div className="min-h-screen bg-princess-gradient sparkle-bg">
      {/* Header */}
      <header className="relative z-10 p-4 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <Crown className="w-8 h-8 text-princess-gold animate-pulse" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-princess-pink to-princess-purple bg-clip-text text-transparent">
              SHROUK Mining
            </h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 pb-20">
        {activeTab === 'mining' && <MiningDashboard />}
        {activeTab === 'cards' && <PrincessCards />}
        {activeTab === 'wallet' && <WalletSection />}
        {activeTab === 'tasks' && <TasksPage onAdminAccess={handleAdminAccess} />}
        {activeTab === 'referral' && <ReferralPage />}
        {activeTab === 'admin' && <AdminPanel />}
      </main>

      {/* Bottom Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Floating Sparkles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <Sparkles
            key={i}
            className="absolute text-princess-gold opacity-60 animate-sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              fontSize: `${Math.random() * 20 + 10}px`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Index;
