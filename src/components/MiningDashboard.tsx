import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { Zap, Coins, TrendingUp, Sparkles, ArrowUp } from 'lucide-react';
export const MiningDashboard = () => {
  const {
    t
  } = useLanguage();
  const [tapsRemaining, setTapsRemaining] = useState(1000);
  const [maxTaps, setMaxTaps] = useState(1000);
  const [shrougEarned, setShrougEarned] = useState(0);
  const [tonEarned, setTonEarned] = useState(0);
  const [tapValue, setTapValue] = useState(0.001);
  const [isTapping, setIsTapping] = useState(false);
  const [tapUpgradeLevel, setTapUpgradeLevel] = useState(1);
  const [floatingCoins, setFloatingCoins] = useState<Array<{
    id: number;
    x: number;
    y: number;
  }>>([]);

  // محسن للنقر السريع مع دعم اللمس
  const handleTap = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (tapsRemaining <= 0) {
      return;
    }
    setIsTapping(true);
    setTapsRemaining(prev => Math.max(0, prev - 1));

    // ربح SHROUK فقط
    setShrougEarned(prev => prev + tapValue);

    // إضافة تأثير العملة المتطايرة
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = (event.type.includes('touch') ? (event as React.TouchEvent).touches[0]?.clientX : (event as React.MouseEvent).clientX) - rect.left;
    const y = (event.type.includes('touch') ? (event as React.TouchEvent).touches[0]?.clientY : (event as React.MouseEvent).clientY) - rect.top;
    const coinId = Date.now() + Math.random();
    setFloatingCoins(prev => [...prev, {
      id: coinId,
      x,
      y
    }]);
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
  return <div className="space-y-6">
      {/* Mining Stats - SHROUK Only */}
      <div className="grid grid-cols-1 gap-4 px-[13px]">
        <Card className="glass-card p-4 animate-float rounded-full px-0 my-0 py-[6px] mx-[28px]">
          <div className="flex items-center gap-2 mb-2 px-[106px]">
            
            <span className="text-sm font-medium">SHROUK</span>
          </div>
          <p className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent px-[127px]">
            {shrougEarned.toFixed(0)}
          </p>
        </Card>
      </div>

      {/* Mining Button */}
      <Card className="glass-card p-6 text-center relative overflow-hidden">
        <div className="mb-4">
          <div className="w-40 h-40 mx-auto mb-4 relative">
            <div className={`w-full h-full cursor-pointer transition-all duration-100 relative ${isTapping ? 'scale-95' : 'hover:scale-105'} ${tapsRemaining <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`} onMouseDown={handleTap} onTouchStart={handleTap} style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            touchAction: 'manipulation'
          }}>
              <img src="/lovable-uploads/b9511081-08ef-4089-85f5-8978bd7b19b9.png" alt="Butterfly Mining" className="w-full h-full object-contain drop-shadow-2xl animate-pulse-glow" draggable={false} />
              
              {/* تأثير التوهج */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
              
              {/* عرض قيمة النقرة */}
              
            </div>
            
            {/* العملات المتطايرة */}
            {floatingCoins.map(coin => <div key={coin.id} className="absolute pointer-events-none animate-float-up" style={{
            left: coin.x,
            top: coin.y,
            transform: 'translate(-50%, -50%)'
          }}>
                <div className="text-blue-500 font-bold text-lg">+{tapValue.toFixed(4)}</div>
              </div>)}
            
            {/* شرارات التأثير */}
            {isTapping && <div className="absolute inset-0 pointer-events-none">
                <Sparkles className="absolute top-2 right-2 text-blue-400 animate-sparkle" />
                <Sparkles className="absolute bottom-2 left-2 text-purple-400 animate-sparkle" style={{
              animationDelay: '0.3s'
            }} />
                <Sparkles className="absolute top-1/2 left-2 text-blue-300 animate-sparkle" style={{
              animationDelay: '0.6s'
            }} />
                <Sparkles className="absolute top-2 left-1/2 text-purple-300 animate-sparkle" style={{
              animationDelay: '0.9s'
            }} />
              </div>}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">{t('tapsRemaining')}</span>
              <span className="text-sm font-medium">{tapsRemaining}/{maxTaps}</span>
            </div>
            <Progress value={tapsRemaining / maxTaps * 100} className="h-3 bg-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={refillTaps} variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-200" disabled={shrougEarned < 2000}>
              Refill (2K SHROUK)
            </Button>
            <Button onClick={upgradeTapCapacity} variant="outline" size="sm" className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white transition-all duration-200" disabled={shrougEarned < tapUpgradeLevel * 5000}>
              <ArrowUp className="w-4 h-4 mr-1" />
              +1K Taps
            </Button>
          </div>

          <Button onClick={upgradeTapValue} variant="outline" size="sm" className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200" disabled={shrougEarned < tapValue * 10000}>
            Upgrade Tap Value (+50%)
          </Button>
        </div>
      </Card>

      {/* Hourly Earnings Preview */}
      <Card className="glass-card p-4 rounded-full py-[7px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="font-bold">{t('hourlyEarnings')}</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-500 font-bold">+0.025 SHROUK</p>
            
          </div>
        </div>
      </Card>
    </div>;
};