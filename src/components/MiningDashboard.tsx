
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { Zap, Coins, TrendingUp, Sparkles, ArrowUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const MiningDashboard = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [tapsRemaining, setTapsRemaining] = useState(1000);
  const [maxTaps, setMaxTaps] = useState(1000);
  const [shrougEarned, setShrougEarned] = useState(0);
  const [tonEarned, setTonEarned] = useState(0);
  const [tapValue, setTapValue] = useState(0.001);
  const [isTapping, setIsTapping] = useState(false);
  const [tapUpgradeLevel, setTapUpgradeLevel] = useState(1);

  // Improved tap handling - allows rapid tapping
  const handleTap = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    
    if (tapsRemaining <= 0) {
      toast({
        title: "No taps remaining!",
        description: "Please refill or upgrade your tap capacity.",
        variant: "destructive"
      });
      return;
    }

    setIsTapping(true);
    setTapsRemaining(prev => Math.max(0, prev - 1));
    
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

    setTimeout(() => setIsTapping(false), 100);
  };

  const refillTaps = () => {
    if (shrougEarned >= 2000) {
      setShrougEarned(prev => prev - 2000);
      setTapsRemaining(maxTaps);
      toast({
        title: "Taps Refilled!",
        description: "You're ready to mine again! (-2000 SHROUK)",
      });
    } else {
      toast({
        title: "Insufficient SHROUK!",
        description: "You need 2000 SHROUK to refill taps.",
        variant: "destructive"
      });
    }
  };

  const upgradeTapCapacity = () => {
    const upgradeCost = tapUpgradeLevel * 5000;
    if (shrougEarned >= upgradeCost) {
      setShrougEarned(prev => prev - upgradeCost);
      setMaxTaps(prev => prev + 1000);
      setTapsRemaining(prev => prev + 1000);
      setTapUpgradeLevel(prev => prev + 1);
      toast({
        title: "Capacity Upgraded!",
        description: `Max taps increased by 1000! (-${upgradeCost} SHROUK)`,
      });
    } else {
      toast({
        title: "Insufficient SHROUK!",
        description: `You need ${upgradeCost} SHROUK to upgrade capacity.`,
        variant: "destructive"
      });
    }
  };

  const upgradeTapValue = () => {
    const upgradeCost = tapValue * 10000;
    if (shrougEarned >= upgradeCost) {
      setShrougEarned(prev => prev - upgradeCost);
      setTapValue(prev => prev * 1.5);
      toast({
        title: "Tap Value Upgraded!",
        description: `Earn 50% more per tap! (-${upgradeCost.toFixed(0)} SHROUK)`,
      });
    } else {
      toast({
        title: "Insufficient SHROUK!",
        description: `You need ${upgradeCost.toFixed(0)} SHROUK to upgrade tap value.`,
        variant: "destructive"
      });
    }
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
            {shrougEarned.toFixed(0)}
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
              onMouseDown={handleTap}
              onTouchStart={handleTap}
              disabled={tapsRemaining <= 0}
              className={`w-full h-full rounded-full princess-button text-xl font-bold transition-all duration-100 ${
                isTapping ? 'animate-tap-bounce scale-95' : 'animate-pulse-glow'
              }`}
            >
              <div className="flex flex-col items-center">
                <Zap className="w-8 h-8 mb-2" />
                {t('mineNow')}
                <span className="text-sm">+{tapValue.toFixed(4)}</span>
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

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={refillTaps}
              variant="outline"
              size="sm"
              className="border-princess-pink text-princess-pink hover:bg-princess-pink hover:text-white"
              disabled={shrougEarned < 2000}
            >
              Refill (2K SHROUK)
            </Button>
            <Button
              onClick={upgradeTapCapacity}
              variant="outline"
              size="sm"
              className="border-princess-purple text-princess-purple hover:bg-princess-purple hover:text-white"
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
            className="w-full border-princess-gold text-princess-gold hover:bg-princess-gold hover:text-white"
            disabled={shrougEarned < (tapValue * 10000)}
          >
            Upgrade Tap Value (+50%)
          </Button>
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
