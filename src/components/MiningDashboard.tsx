import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { Zap, Coins, TrendingUp, Sparkles, ArrowUp, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserAddress } from '@/hooks/useUserAddress';

export const MiningDashboard = () => {
  const { t } = useLanguage();
  const address = useUserAddress();

  // State for mining stats
  const [tapsRemaining, setTapsRemaining] = useState(0);
  const [maxTaps, setMaxTaps] = useState(1000);
  const [shrougEarned, setShrougEarned] = useState(0);
  const [tapValue, setTapValue] = useState(0.001);
  const [isTapping, setIsTapping] = useState(false);
  const [tapUpgradeLevel, setTapUpgradeLevel] = useState(1);
  const [floatingCoins, setFloatingCoins] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [loading, setLoading] = useState(true);

  // Load the user's tap points from Supabase
  useEffect(() => {
    let mounted = true;
    async function loadUserTapStats() {
      if (!address) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('user_tap_points')
        .select('*')
        .eq('user_address', address)
        .maybeSingle();

      if (error) {
        // fallback to initial values, could handle error/toast
        setLoading(false);
        return;
      }
      if (mounted) {
        if (data) {
          setShrougEarned(Number(data.tap_points) || 0);
          setTapsRemaining(Number(data.max_taps) - Number(data.tap_points) % Number(data.max_taps));
          setMaxTaps(Number(data.max_taps) || 1000);
          setTapValue(Number(data.tap_value) || 0.001);
          setTapUpgradeLevel(Number(data.tap_upgrade_level) || 1);
        } else {
          // Initialize new user row with defaults
          (async () => {
            await supabase.from('user_tap_points').insert({
              user_address: address,
              tap_points: 0,
              max_taps: 1000,
              tap_value: 0.001,
              tap_upgrade_level: 1,
            });
            setShrougEarned(0);
            setTapsRemaining(1000);
            setMaxTaps(1000);
            setTapValue(0.001);
            setTapUpgradeLevel(1);
          })();
        }
        setLoading(false);
      }
    }
    loadUserTapStats();
    return () => {
      mounted = false;
    };
  }, [address]);

  // Helper to update the user's tap points and sync with wallet balance
  async function updateTapStats(
    changes: Partial<{
      tap_points: number;
      max_taps: number;
      tap_value: number;
      tap_upgrade_level: number;
    }>
  ) {
    if (!address) return;
    
    // Update tap points
    await supabase
      .from('user_tap_points')
      .update(changes)
      .eq('user_address', address);

    // If tap_points changed, update the SHROUK balance in user_balances
    if (changes.tap_points !== undefined) {
      await supabase
        .from('user_balances')
        .upsert({
          user_address: address,
          shrouk_balance: changes.tap_points,
          ton_balance: 0 // Keep existing TON balance, only update SHROUK
        }, {
          onConflict: 'user_address'
        });
    }
  }

  // Tap logic and sync
  const handleTap = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (tapsRemaining <= 0 || loading) return;
    setIsTapping(true);
    setTapsRemaining(prev => Math.max(0, prev - 1));
    const newShrougBalance = shrougEarned + tapValue;
    setShrougEarned(newShrougBalance);

    // Coins animation FX
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x =
      (event.type.includes('touch')
        ? (event as React.TouchEvent).touches[0]?.clientX
        : (event as React.MouseEvent).clientX) - rect.left;
    const y =
      (event.type.includes('touch')
        ? (event as React.TouchEvent).touches[0]?.clientY
        : (event as React.MouseEvent).clientY) - rect.top;
    const coinId = Date.now() + Math.random();
    setFloatingCoins(prev => [
      ...prev,
      { id: coinId, x, y }
    ]);
    setTimeout(() => {
      setFloatingCoins(prev => prev.filter(coin => coin.id !== coinId));
    }, 1000);
    setTimeout(() => setIsTapping(false), 100);

    // Sync to Supabase after tap - update both tap points and wallet balance
    updateTapStats({ tap_points: newShrougBalance });
  };

  const refillTaps = async () => {
    if (shrougEarned < 2000) return;
    const newBalance = shrougEarned - 2000;
    setShrougEarned(newBalance);
    setTapsRemaining(maxTaps);
    // Sync points and balance
    await updateTapStats({ tap_points: newBalance });
  };

  const upgradeTapCapacity = async () => {
    const upgradeCost = tapUpgradeLevel * 5000;
    if (shrougEarned < upgradeCost) return;
    const newBalance = shrougEarned - upgradeCost;
    setShrougEarned(newBalance);
    setMaxTaps(prev => prev + 1000);
    setTapsRemaining(prev => prev + 1000);
    setTapUpgradeLevel(prev => prev + 1);

    await updateTapStats({
      tap_points: newBalance,
      max_taps: maxTaps + 1000,
      tap_upgrade_level: tapUpgradeLevel + 1,
    });
  };

  const upgradeTapValue = async () => {
    const upgradeCost = tapValue * 10000;
    if (shrougEarned < upgradeCost) return;
    const newBalance = shrougEarned - upgradeCost;
    setShrougEarned(newBalance);
    setTapValue(prev => prev * 1.5);

    await updateTapStats({
      tap_points: newBalance,
      tap_value: tapValue * 1.5,
    });
  };

  // Loading UI
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-gray-500 animate-pulse">{t('loading')}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mining Stats - SHROUK Only */}
      <div className="grid grid-cols-1 gap-4 px-4 py-0 my-[10px]">
        <Card className="glass-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div className="absolute top-1 right-1">
            <Star className="w-3 h-3 text-yellow-400 animate-pulse" />
          </div>
          <div className="relative p-3 text-center py-0 px-0">
            <div className="bg-white/30 backdrop-blur-sm p-3 shadow-inner mx-[97px] px-px my-px py-0 rounded-none">
              <p className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {shrougEarned.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Total Balance</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Mining Button */}
      <Card className="glass-card p-6 text-center relative overflow-hidden">
        <div className="mb-4">
          <div className="w-40 h-40 mx-auto mb-4 relative">
            <div
              className={`w-full h-full cursor-pointer transition-all duration-100 relative ${isTapping ? 'scale-95' : 'hover:scale-105'} ${tapsRemaining <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onMouseDown={handleTap}
              onTouchStart={handleTap}
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                touchAction: 'manipulation'
              }}
            >
              <img src="/lovable-uploads/b9511081-08ef-4089-85f5-8978bd7b19b9.png" alt="Butterfly Mining" className="w-full h-full object-contain drop-shadow-2xl animate-pulse-glow" draggable={false} />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            {/* العملات المتطايرة */}
            {floatingCoins.map(coin => (
              <div key={coin.id} className="absolute pointer-events-none animate-float-up" style={{
                left: coin.x,
                top: coin.y,
                transform: 'translate(-50%, -50%)'
              }}>
                <div className="text-blue-500 font-bold text-lg">+{tapValue.toFixed(4)}</div>
              </div>
            ))}
            {/* شرارات التأثير */}
            {isTapping && (
              <div className="absolute inset-0 pointer-events-none">
                <Sparkles className="absolute top-2 right-2 text-blue-400 animate-sparkle" />
                <Sparkles className="absolute bottom-2 left-2 text-purple-400 animate-sparkle" style={{ animationDelay: '0.3s' }} />
                <Sparkles className="absolute top-1/2 left-2 text-blue-300 animate-sparkle" style={{ animationDelay: '0.6s' }} />
                <Sparkles className="absolute top-2 left-1/2 text-purple-300 animate-sparkle" style={{ animationDelay: '0.9s' }} />
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
    </div>
  );
};
