
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { Zap, Coins, TrendingUp, Sparkles, ArrowUp } from 'lucide-react';

export const MiningDashboard = () => {
  const { t } = useLanguage();
  const [tapsRemaining, setTapsRemaining] = useState(1000);
  const [maxTaps, setMaxTaps] = useState(1000);
  const [shrougEarned, setShrougEarned] = useState(0);
  const [tonEarned, setTonEarned] = useState(0);
  const [tapValue, setTapValue] = useState(0.001);
  const [isTapping, setIsTapping] = useState(false);
  const [tapUpgradeLevel, setTapUpgradeLevel] = useState(1);
  const [floatingCoins, setFloatingCoins] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // تحسين النقر للعمل مع اللمس والماوس
  const handleTap = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (tapsRemaining <= 0 || isTapping) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setIsTapping(true);
    setTapsRemaining(prev => Math.max(0, prev - 1));
    setShrougEarned(prev => prev + tapValue);

    // إضافة تأثير العملة المتطايرة
    const coinId = Date.now();
    setFloatingCoins(prev => [...prev, { id: coinId, x, y }]);
    
    setTimeout(() => {
      setFloatingCoins(prev => prev.filter(coin => coin.id !== coinId));
    }, 1000);

    setTimeout(() => setIsTapping(false), 100);
  };

  const refillTaps = () => {
    if (shrougEarned >= 2000) {
      setShrougEarned(prev => prev - 2000);
      setTapsRemaining(maxTaps);
    }
  };

  const upgradeTapCapacity = () => {
    const upgradeCost = tapUpgradeLevel * 5000;
    if (shrougEarned >= upgradeCost) {
      setShrougEarned(prev => prev - upgradeCost);
      setMaxTaps(prev => prev + 1000);
      setTapsRemaining(prev => prev + 1000);
      setTapUpgradeLevel(prev => prev + 1);
    }
  };

  const upgradeTapValue = () => {
    const upgradeCost = tapValue * 10000;
    if (shrougEarned >= upgradeCost) {
      setShrougEarned(prev => prev - upgradeCost);
      setTapValue(prev => prev * 1.5);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mining Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card p-4 animate-float bg-gradient-to-br from-princess-pink/20 to-princess-purple/10">
          <div className="flex items-center gap-2 mb-2">
            <img 
              src="/lovable-uploads/52649dfd-4d2c-4a70-89ec-dacd9a5e0c69.png" 
              alt="SHROUK" 
              className="w-6 h-6"
            />
            <span className="text-sm font-medium text-princess-pink">SHROUK</span>
          </div>
          <p className="text-2xl font-bold text-princess-pink">
            {shrougEarned.toFixed(0)}
          </p>
        </Card>

        <Card className="glass-card p-4 animate-float bg-gradient-to-br from-blue-100/30 to-blue-200/20" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-blue-600">TON</span>
          </div>
          <p className="text-2xl font-bold text-blue-500">
            {tonEarned.toFixed(4)}
          </p>
        </Card>
      </div>

      {/* Mining Button */}
      <Card className="glass-card p-6 text-center bg-gradient-to-br from-princess-pink/10 to-princess-purple/5">
        <div className="mb-4">
          <div className="w-40 h-40 mx-auto mb-4 relative">
            <div
              className={`w-full h-full rounded-full relative cursor-pointer select-none transition-all duration-100 ${
                isTapping ? 'scale-95' : 'hover:scale-105'
              } ${tapsRemaining <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onMouseDown={handleTap}
              onTouchStart={handleTap}
              style={{ 
                userSelect: 'none', 
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                touchAction: 'manipulation'
              }}
            >
              <img 
                src="/lovable-uploads/38746c32-f5c3-46e6-afdb-7387147dc905.png"
                alt="Tap to mine"
                className="w-full h-full object-cover rounded-full shadow-2xl"
                draggable={false}
              />
              
              {/* تأثير التوهج */}
              <div className={`absolute inset-0 rounded-full bg-princess-pink/20 ${isTapping ? 'animate-ping' : 'animate-pulse-glow'}`} />
              
              {/* النص المتراكب */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold text-shadow">
                <Zap className="w-8 h-8 mb-2 drop-shadow-lg" />
                <span className="text-lg drop-shadow-lg">{t('mineNow')}</span>
                <span className="text-sm drop-shadow-lg">+{tapValue.toFixed(4)}</span>
              </div>

              {/* العملات المتطايرة */}
              {floatingCoins.map((coin) => (
                <div
                  key={coin.id}
                  className="absolute text-princess-gold font-bold text-lg animate-bounce pointer-events-none"
                  style={{
                    left: coin.x,
                    top: coin.y,
                    transform: 'translate(-50%, -50%)',
                    animation: 'fade-out 1s ease-out forwards'
                  }}
                >
                  +{tapValue.toFixed(4)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{t('tapsRemaining')}</span>
              <span className="text-sm font-bold text-princess-purple">{tapsRemaining}/{maxTaps}</span>
            </div>
            <Progress 
              value={(tapsRemaining / maxTaps) * 100} 
              className="h-3 bg-white/20" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={refillTaps}
              variant="outline"
              size="sm"
              className="border-2 border-princess-pink text-princess-pink hover:bg-princess-pink hover:text-white font-bold shadow-lg transition-all duration-300"
              disabled={shrougEarned < 2000}
            >
              <Zap className="w-4 h-4 mr-1" />
              Refill (2K)
            </Button>
            <Button
              onClick={upgradeTapCapacity}
              variant="outline"
              size="sm"
              className="border-2 border-princess-purple text-princess-purple hover:bg-princess-purple hover:text-white font-bold shadow-lg transition-all duration-300"
              disabled={shrougEarned < (tapUpgradeLevel * 5000)}
            >
              <ArrowUp className="w-4 h-4 mr-1" />
              +1K Taps
            </Button>
          </div>

          <Button
            onClick={upgradeTapValue}
            variant="outline"
            size="sm"
            className="w-full border-2 border-princess-gold text-princess-gold hover:bg-princess-gold hover:text-black font-bold shadow-lg transition-all duration-300"
            disabled={shrougEarned < (tapValue * 10000)}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Upgrade Tap Value (+50%)
          </Button>
        </div>
      </Card>

      {/* Hourly Earnings Preview */}
      <Card className="glass-card p-4 bg-gradient-to-r from-princess-purple/10 to-princess-pink/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-princess-purple" />
            <span className="font-medium">{t('hourlyEarnings')}</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-princess-pink font-semibold">+0.025 SHROUK</p>
            <p className="text-sm text-blue-500 font-semibold">+0.002 TON</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
