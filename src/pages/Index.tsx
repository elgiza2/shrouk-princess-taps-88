
import React, { useState, useRef } from 'react';
import { MiningDashboard } from '@/components/MiningDashboard';
import { PrincessCards } from '@/components/PrincessCards';
import { WalletSection } from '@/components/WalletSection';
import { TasksPage } from '@/components/TasksPage';
import { ReferralPage } from '@/components/ReferralPage';
import { AdminPanel } from '@/components/AdminPanel';
import { Navigation } from '@/components/Navigation';
import { LanguageSelector } from '@/components/LanguageSelector';
import { SplashPage } from '@/components/SplashPage';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('mining');
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const { t } = useLanguage();
  // Hold a ref to debounce admin tap gestures
  const lastTapRef = useRef<number>(0);

  // Custom tab change that counts taps on "tasks"
  const handleTabChange = (tab: string) => {
    if (tab === 'tasks') {
      const now = Date.now();
      // Reset tap count if more than 3 seconds have passed
      if (now - lastTapRef.current > 3000) setAdminTapCount(0);
      lastTapRef.current = now;
      setAdminTapCount((count) => {
        const newCount = count + 1;
        if (newCount >= 7) {
          setShowAdminPanel(true);
          return 0;
        }
        return newCount;
      });
    }
    setActiveTab(tab);
    // Close admin panel if moving away
    if (tab !== 'admin') setShowAdminPanel(false);
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Show splash page if not completed
  if (showSplash) {
    return <SplashPage onComplete={handleSplashComplete} />;
  }

  return (
    <div className="min-h-screen bg-princess-gradient sparkle-bg">
      {/* Header */}
      <header className="relative z-10 p-4 bg-white/10 backdrop-blur-md border-b border-white/20 py-0">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/b9511081-08ef-4089-85f5-8978bd7b19b9.png" alt="SHROUK Logo" className="w-8 h-8 animate-pulse" />
            <h1 className="font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-xl text-fuchsia-950">
              SHROUK Mining
            </h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 pb-20 py-0">
        {activeTab === 'mining' && <MiningDashboard />}
        {activeTab === 'cards' && <PrincessCards />}
        {activeTab === 'wallet' && <WalletSection />}
        {activeTab === 'tasks' && !showAdminPanel && <TasksPage />}
        {activeTab === 'referral' && <ReferralPage />}
        {/* Secret: Admin Panel triggers after 7x tap; only from "tasks" tab */}
        {showAdminPanel && <AdminPanel />}
      </main>

      {/* Bottom Navigation */}
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      {/* Floating Sparkles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => <Sparkles key={i} className="absolute text-blue-400 opacity-60 animate-sparkle" style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 2}s`,
          fontSize: `${Math.random() * 20 + 10}px`
        }} />)}
      </div>
    </div>
  );
};
export default Index;
