
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wallet, Sparkles } from 'lucide-react';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';

interface SplashPageProps {
  onComplete: () => void;
}

export const SplashPage = ({ onComplete }: SplashPageProps) => {
  const { t } = useLanguage();
  const wallet = useTonWallet();
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);

  useEffect(() => {
    // Show wallet prompt after 2 seconds
    const timer = setTimeout(() => {
      setShowWalletPrompt(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // If wallet is connected, proceed to main app after a short delay
    if (wallet?.account?.address) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [wallet?.account?.address, onComplete]);

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-princess-gradient sparkle-bg flex items-center justify-center p-4">
      {/* Logo and Title */}
      <div className="text-center space-y-8 max-w-md w-full">
        <div className="space-y-4">
          <img 
            src="/lovable-uploads/b9511081-08ef-4089-85f5-8978bd7b19b9.png" 
            alt="SHROUK Logo" 
            className="w-24 h-24 mx-auto animate-pulse" 
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
            SHROUK Mining
          </h1>
          <p className="text-lg text-white/80">
            {t('mineCryptoWithCards')}
          </p>
        </div>

        {/* Wallet Connection Prompt */}
        {showWalletPrompt && (
          <Card className="glass-card p-6 space-y-6 animate-fadeIn">
            <div className="flex justify-center">
              <Wallet className="w-16 h-16 text-princess-purple" />
            </div>
            
            <div className="space-y-3 text-center">
              <h2 className="text-xl font-bold text-white">
                {t('connectWalletToStart')}
              </h2>
              <p className="text-white/80">
                {t('connectWalletDescription')}
              </p>
            </div>

            <div className="space-y-4">
              <TonConnectButton className="mx-auto" />
              
              <Button 
                onClick={handleSkip}
                variant="ghost" 
                className="w-full text-white/70 hover:text-white"
              >
                {t('skipForNow')}
              </Button>
            </div>
          </Card>
        )}

        {/* Loading Animation */}
        {!showWalletPrompt && (
          <div className="space-y-4">
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-princess-pink rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-princess-purple rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-princess-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-white/70 text-center">{t('loading')}...</p>
          </div>
        )}

        {/* Floating Sparkles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <Sparkles 
              key={i} 
              className="absolute text-princess-gold opacity-40 animate-sparkle" 
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                fontSize: `${Math.random() * 16 + 12}px`
              }} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};
