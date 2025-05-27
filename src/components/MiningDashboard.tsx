import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { Zap, Coins, TrendingUp, Sparkles, ArrowUp, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTonWallet } from '@tonconnect/ui-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const MiningDashboard = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const wallet = useTonWallet();
  const queryClient = useQueryClient();

  const [isTapping, setIsTapping] = useState(false);
  const [floatingCoins, setFloatingCoins] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Fetch user tap points
  const { data: tapData, isLoading } = useQuery({
    queryKey: ['user-tap-points', wallet?.account?.address],
    queryFn: async () => {
      if (!wallet?.account?.address) return null;
      
      const { data, error } = await supabase
        .from('user_tap_points')
        .select('*')
        .eq('user_address', wallet.account.address)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!wallet?.account?.address,
  });

  // Fetch user balance
  const { data: userBalance } = useQuery({
    queryKey: ['user-balance', wallet?.account?.address],
    queryFn: async () => {
      if (!wallet?.account?.address) return null;
      
      const { data, error } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_address', wallet.account.address)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!wallet?.account?.address,
  });

  // Initialize user data mutation with proper error handling
  const initializeUserMutation = useMutation({
    mutationFn: async () => {
      if (!wallet?.account?.address) throw new Error('No wallet connected');
      
      // Initialize tap points if not exists using upsert
      if (!tapData) {
        const { error: tapError } = await supabase.from('user_tap_points').upsert({
          user_address: wallet.account.address,
          tap_points: 0,
          max_taps: 1000,
          tap_value: 0.001,
          tap_upgrade_level: 1,
        }, {
          onConflict: 'user_address'
        });
        
        if (tapError) {
          console.error('Error initializing tap points:', tapError);
          throw tapError;
        }
      }
      
      // Initialize balance if not exists using upsert
      if (!userBalance) {
        const { error: balanceError } = await supabase.from('user_balances').upsert({
          user_address: wallet.account.address,
          shrouk_balance: 0,
          ton_balance: 0
        }, {
          onConflict: 'user_address'
        });
        
        if (balanceError) {
          console.error('Error initializing balance:', balanceError);
          throw balanceError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tap-points'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error) => {
      console.error('Initialization error:', error);
      // Don't show error toast for duplicate key errors as they're expected
      if (!error.message.includes('duplicate key')) {
        toast({
          title: t('initializationError'),
          description: t('couldNotInitializeAccount'),
          variant: "destructive"
        });
      }
    },
  });

  // Initialize user data on wallet connection
  useEffect(() => {
    if (wallet?.account?.address && (!tapData || !userBalance)) {
      initializeUserMutation.mutate();
    }
  }, [wallet?.account?.address, tapData, userBalance]);

  // Tap mutation with better error handling
  const tapMutation = useMutation({
    mutationFn: async () => {
      if (!wallet?.account?.address || !tapData) throw new Error('No data available');
      
      const currentTaps = tapData.tap_points || 0;
      const maxTaps = tapData.max_taps || 1000;
      const tapValue = tapData.tap_value || 0.001;
      
      // Check if can tap
      const tapsUsed = currentTaps % maxTaps;
      const tapsRemaining = maxTaps - tapsUsed;
      
      if (tapsRemaining <= 0) {
        throw new Error('No taps remaining');
      }
      
      const newTapPoints = currentTaps + tapValue;
      
      // Update tap points
      const { error: tapError } = await supabase
        .from('user_tap_points')
        .update({ 
          tap_points: newTapPoints,
          last_tap_at: new Date().toISOString()
        })
        .eq('user_address', wallet.account.address);
      
      if (tapError) throw tapError;
      
      // Update balance using upsert to avoid conflicts
      const { error: balanceError } = await supabase
        .from('user_balances')
        .upsert({
          user_address: wallet.account.address,
          shrouk_balance: newTapPoints,
          ton_balance: userBalance?.ton_balance || 0
        }, {
          onConflict: 'user_address'
        });
      
      if (balanceError) throw balanceError;
      
      // Record transaction
      await supabase.from('transactions').insert({
        user_address: wallet.account.address,
        transaction_type: 'mining',
        amount: tapValue,
        currency: 'SHROUK',
        status: 'completed'
      });
      
      return { newTapPoints, tapValue };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tap-points'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error: any) => {
      if (error.message !== 'No taps remaining') {
        console.error('Tap error:', error);
        toast({
          title: t('tapError'),
          description: t('tapErrorDescription'),
          variant: "destructive"
        });
      }
    },
  });

  // Refill taps mutation
  const refillTapsMutation = useMutation({
    mutationFn: async () => {
      if (!wallet?.account?.address || !tapData || !userBalance) throw new Error('No data available');
      
      const cost = 2000;
      const currentBalance = userBalance.shrouk_balance || 0;
      
      if (currentBalance < cost) {
        throw new Error('Insufficient balance');
      }
      
      // Update balance using upsert
      const { error: balanceError } = await supabase
        .from('user_balances')
        .upsert({ 
          user_address: wallet.account.address,
          shrouk_balance: currentBalance - cost,
          ton_balance: userBalance.ton_balance || 0
        }, {
          onConflict: 'user_address'
        });
      
      if (balanceError) throw balanceError;
      
      // Reset tap points to allow full taps again
      const { error: tapError } = await supabase
        .from('user_tap_points')
        .update({ tap_points: (currentBalance - cost) })
        .eq('user_address', wallet.account.address);
      
      if (tapError) throw tapError;
      
      // Record transaction
      await supabase.from('transactions').insert({
        user_address: wallet.account.address,
        transaction_type: 'refill_taps',
        amount: cost,
        currency: 'SHROUK',
        status: 'completed'
      });
      
      return cost;
    },
    onSuccess: () => {
      toast({
        title: t('tapsRefilled'),
        description: t('tapsRefilledSuccess'),
      });
      queryClient.invalidateQueries({ queryKey: ['user-tap-points'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error: any) => {
      console.error('Refill error:', error);
      toast({
        title: t('refillError'),
        description: error.message === 'Insufficient balance' ? t('insufficientBalance') : t('refillErrorDescription'),
        variant: "destructive"
      });
    },
  });

  // Upgrade tap capacity mutation
  const upgradeTapCapacityMutation = useMutation({
    mutationFn: async () => {
      if (!wallet?.account?.address || !tapData || !userBalance) throw new Error('No data available');
      
      const cost = tapData.tap_upgrade_level * 5000;
      const currentBalance = userBalance.shrouk_balance || 0;
      
      if (currentBalance < cost) {
        throw new Error('Insufficient balance');
      }
      
      // Update balance using upsert
      const { error: balanceError } = await supabase
        .from('user_balances')
        .upsert({ 
          user_address: wallet.account.address,
          shrouk_balance: currentBalance - cost,
          ton_balance: userBalance.ton_balance || 0
        }, {
          onConflict: 'user_address'
        });
      
      if (balanceError) throw balanceError;
      
      // Upgrade tap capacity
      const { error: tapError } = await supabase
        .from('user_tap_points')
        .update({ 
          max_taps: tapData.max_taps + 1000,
          tap_upgrade_level: tapData.tap_upgrade_level + 1,
          tap_points: currentBalance - cost
        })
        .eq('user_address', wallet.account.address);
      
      if (tapError) throw tapError;
      
      // Record transaction
      await supabase.from('transactions').insert({
        user_address: wallet.account.address,
        transaction_type: 'upgrade_capacity',
        amount: cost,
        currency: 'SHROUK',
        status: 'completed'
      });
      
      return cost;
    },
    onSuccess: () => {
      toast({
        title: t('capacityUpgraded'),
        description: t('capacityUpgradedSuccess'),
      });
      queryClient.invalidateQueries({ queryKey: ['user-tap-points'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error: any) => {
      console.error('Capacity upgrade error:', error);
      toast({
        title: t('upgradeError'),
        description: error.message === 'Insufficient balance' ? t('insufficientBalance') : t('upgradeErrorDescription'),
        variant: "destructive"
      });
    },
  });

  // Upgrade tap value mutation
  const upgradeTapValueMutation = useMutation({
    mutationFn: async () => {
      if (!wallet?.account?.address || !tapData || !userBalance) throw new Error('No data available');
      
      const cost = tapData.tap_value * 10000;
      const currentBalance = userBalance.shrouk_balance || 0;
      
      if (currentBalance < cost) {
        throw new Error('Insufficient balance');
      }
      
      // Update balance using upsert
      const { error: balanceError } = await supabase
        .from('user_balances')
        .upsert({ 
          user_address: wallet.account.address,
          shrouk_balance: currentBalance - cost,
          ton_balance: userBalance.ton_balance || 0
        }, {
          onConflict: 'user_address'
        });
      
      if (balanceError) throw balanceError;
      
      // Upgrade tap value
      const { error: tapError } = await supabase
        .from('user_tap_points')
        .update({ 
          tap_value: tapData.tap_value * 1.5,
          tap_points: currentBalance - cost
        })
        .eq('user_address', wallet.account.address);
      
      if (tapError) throw tapError;
      
      // Record transaction
      await supabase.from('transactions').insert({
        user_address: wallet.account.address,
        transaction_type: 'upgrade_value',
        amount: cost,
        currency: 'SHROUK',
        status: 'completed'
      });
      
      return cost;
    },
    onSuccess: () => {
      toast({
        title: t('valueUpgraded'),
        description: t('valueUpgradedSuccess'),
      });
      queryClient.invalidateQueries({ queryKey: ['user-tap-points'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error: any) => {
      console.error('Value upgrade error:', error);
      toast({
        title: t('upgradeError'),
        description: error.message === 'Insufficient balance' ? t('insufficientBalance') : t('upgradeErrorDescription'),
        variant: "destructive"
      });
    },
  });

  const handleTap = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!tapData || tapMutation.isPending) return;
    
    const currentTaps = tapData.tap_points || 0;
    const maxTaps = tapData.max_taps || 1000;
    const tapsUsed = currentTaps % maxTaps;
    const tapsRemaining = maxTaps - tapsUsed;
    
    if (tapsRemaining <= 0) return;
    
    setIsTapping(true);
    tapMutation.mutate();

    // Coins animation FX
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = (event.type.includes('touch')
      ? (event as React.TouchEvent).touches[0]?.clientX
      : (event as React.MouseEvent).clientX) - rect.left;
    const y = (event.type.includes('touch')
      ? (event as React.TouchEvent).touches[0]?.clientY
      : (event as React.MouseEvent).clientY) - rect.top;
    const coinId = Date.now() + Math.random();
    
    setFloatingCoins(prev => [...prev, { id: coinId, x, y }]);
    
    setTimeout(() => {
      setFloatingCoins(prev => prev.filter(coin => coin.id !== coinId));
    }, 1000);
    
    setTimeout(() => setIsTapping(false), 100);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-princess-purple" />
      </div>
    );
  }

  if (!wallet?.account?.address) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">{t('connectWalletToMine')}</p>
      </div>
    );
  }

  if (!tapData || !userBalance) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">{t('initializingAccount')}</p>
      </div>
    );
  }

  const currentTaps = tapData.tap_points || 0;
  const maxTaps = tapData.max_taps || 1000;
  const tapValue = tapData.tap_value || 0.001;
  const tapsUsed = currentTaps % maxTaps;
  const tapsRemaining = maxTaps - tapsUsed;
  const shrougBalance = userBalance.shrouk_balance || 0;

  return (
    <div className="space-y-6">
      {/* Mining Stats - SHROUK Only */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="glass-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div className="absolute top-1 right-1">
            <Star className="w-3 h-3 text-yellow-400 animate-pulse" />
          </div>
          <div className="relative p-3 text-center">
            <div className="bg-white/30 backdrop-blur-sm p-3 shadow-inner rounded-lg">
              <p className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {shrougBalance.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Total SHROUK Balance</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Mining Button */}
      <Card className="glass-card p-6 text-center relative overflow-hidden">
        <div className="mb-4">
          <div className="w-40 h-40 mx-auto mb-4 relative">
            <div
              className={`w-full h-full cursor-pointer transition-all duration-100 relative ${
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
                src="/lovable-uploads/b9511081-08ef-4089-85f5-8978bd7b19b9.png" 
                alt="Butterfly Mining" 
                className="w-full h-full object-contain drop-shadow-2xl animate-pulse-glow" 
                draggable={false} 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            
            {/* Floating coins */}
            {floatingCoins.map(coin => (
              <div 
                key={coin.id} 
                className="absolute pointer-events-none animate-float-up" 
                style={{
                  left: coin.x,
                  top: coin.y,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="text-blue-500 font-bold text-lg">+{tapValue.toFixed(4)}</div>
              </div>
            ))}
            
            {/* Impact sparkles */}
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
            <Button 
              onClick={() => refillTapsMutation.mutate()}
              variant="outline" 
              size="sm" 
              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-200" 
              disabled={refillTapsMutation.isPending || shrougBalance < 2000}
            >
              {refillTapsMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Refill (2K SHROUK)"
              )}
            </Button>
            <Button 
              onClick={() => upgradeTapCapacityMutation.mutate()}
              variant="outline" 
              size="sm" 
              className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white transition-all duration-200" 
              disabled={upgradeTapCapacityMutation.isPending || shrougBalance < (tapData.tap_upgrade_level * 5000)}
            >
              {upgradeTapCapacityMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ArrowUp className="w-4 h-4 mr-1" />
                  +1K Taps
                </>
              )}
            </Button>
          </div>

          <Button 
            onClick={() => upgradeTapValueMutation.mutate()}
            variant="outline" 
            size="sm" 
            className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200" 
            disabled={upgradeTapValueMutation.isPending || shrougBalance < (tapValue * 10000)}
          >
            {upgradeTapValueMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Upgrade Tap Value (+50%)"
            )}
          </Button>
        </div>
      </Card>

      {/* Hourly Earnings Preview */}
      <Card className="glass-card p-4">
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
