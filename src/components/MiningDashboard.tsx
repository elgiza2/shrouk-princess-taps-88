
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { Zap, Coins, TrendingUp, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const MiningDashboard = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [tapsRemaining, setTapsRemaining] = useState(1000);
  const [maxTaps, setMaxTaps] = useState(1000);
  const [shrougEarned, setShrougEarned] = useState(0);
  const [tonEarned, setTonEarned] = useState(0);
  const [tapValue, setTapValue] = useState(0.001);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [isTapping, setIsTapping] = useState(false);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapTime < 1000) return; // 1 second cooldown
    
    if (tapsRemaining <= 0) {
      toast({
        title: "No taps remaining!",
        description: "Please wait or upgrade your tap capacity.",
        variant: "destructive"
      });
      return;
    }

    setIsTapping(true);
    setTapsRemaining(prev => prev - 1);
    setLastTapTime(now);
    
    // Random chance for SHROUK vs TON
    if (Math.random() > 0.7) {
      setTonEarned(prev => prev + tapValue * 0.1);
      toast({
        title: "TON Earned!",
        description: `+${(tapValue * 0.1).toFixed(4)} TON`,
      });
    } else {
      setShrougEarned(prev => prev + tapValue);
      toast({
        title: "SHROUK Earned!",
        description: `+${tapValue.toFixed(4)} SHROUK`,
      });
    }

    setTimeout(() => setIsTapping(false), 200);
  };

  const refillTaps = () => {
    setTapsRemaining(maxTaps);
    toast({
      title: "Taps Refilled!",
      description: "You're ready to mine again!",
    });
  };

  const upgradeTapCapacity = () => {
    setMaxTaps(prev => prev + 500);
    setTapsRemaining(prev => prev + 500);
    toast({
      title: "Capacity Upgraded!",
      description: `Max taps increased to ${maxTaps + 500}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Mining Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card p-4 animate-float">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-5 h-5 text-princess-gold" />
            <span className="text-sm font-medium">SHROUK</span>
          </div>
          <p className="text-2xl font-bold text-princess-pink">
            {shrougEarned.toFixed(4)}
          </p>
        </Card>

        <Card className="glass-card p-4 animate-float" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">TON</span>
          </div>
          <p className="text-2xl font-bold text-blue-500">
            {tonEarned.toFixed(4)}
          </p>
        </Card>
      </div>

      {/* Mining Button */}
      <Card className="glass-card p-6 text-center">
        <div className="mb-4">
          <div className="w-32 h-32 mx-auto mb-4 relative">
            <Button
              onClick={handleTap}
              disabled={tapsRemaining <= 0}
              className={`w-full h-full rounded-full princess-button text-xl font-bold transition-all duration-200 ${
                isTapping ? 'animate-tap-bounce' : 'animate-pulse-glow'
              }`}
            >
              <div className="flex flex-col items-center">
                <Zap className="w-8 h-8 mb-2" />
                {t('mineNow')}
              </div>
            </Button>
            {isTapping && (
              <div className="absolute inset-0 pointer-events-none">
                <Sparkles className="absolute top-2 right-2 text-princess-gold animate-sparkle" />
                <Sparkles className="absolute bottom-2 left-2 text-princess-gold animate-sparkle" style={{ animationDelay: '0.5s' }} />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">{t('tapsRemaining')}</span>
              <span className="text-sm font-medium">{tapsRemaining}/{maxTaps}</span>
            </div>
            <Progress value={(tapsRemaining / maxTaps) * 100} className="h-2" />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={refillTaps}
              variant="outline"
              size="sm"
              className="flex-1 border-princess-pink text-princess-pink hover:bg-princess-pink hover:text-white"
            >
              Refill Taps
            </Button>
            <Button
              onClick={upgradeTapCapacity}
              variant="outline"
              size="sm"
              className="flex-1 border-princess-purple text-princess-purple hover:bg-princess-purple hover:text-white"
            >
              {t('upgrade')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Hourly Earnings Preview */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-princess-purple" />
            <span className="font-medium">{t('hourlyEarnings')}</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-princess-pink">+0.025 SHROUK</p>
            <p className="text-sm text-blue-500">+0.002 TON</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
