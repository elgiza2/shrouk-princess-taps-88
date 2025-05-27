
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Crown, Coins, Star, Sparkles, Loader2, ShoppingCart, TrendingUp, Zap, Gem, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTonWallet } from '@tonconnect/ui-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PrincessCard {
  id: string;
  name: string;
  currency: string;
  hourly_yield: number;
  price: number;
  rarity: string;
  description: string;
  owned?: boolean;
  level?: number;
  image: string;
}

export const PrincessCards = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const wallet = useTonWallet();
  const queryClient = useQueryClient();

  // Fetch cards from database
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('price', { ascending: true });
      if (error) throw error;

      const cardsWithImages = data.map(card => ({
        ...card,
        image: getCardImage(card.name),
        currency: card.name === 'Shrouk' ? 'TON' : 'SHROUK'
      }));
      return cardsWithImages;
    }
  });

  // Fetch user's owned cards
  const { data: userCards = [] } = useQuery({
    queryKey: ['user-cards', wallet?.account?.address],
    queryFn: async () => {
      if (!wallet?.account?.address) return [];
      const { data, error } = await supabase
        .from('user_cards')
        .select('*, cards(*)')
        .eq('user_address', wallet.account.address);
      if (error) throw error;
      return data || [];
    },
    enabled: !!wallet?.account?.address
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
      if (error) throw error;
      return data;
    },
    enabled: !!wallet?.account?.address
  });

  // Process card yields mutation
  const processYieldsMutation = useMutation({
    mutationFn: async () => {
      if (!wallet?.account?.address) throw new Error('No wallet connected');
      const { data, error } = await supabase.rpc('process_card_yields', {
        user_addr: wallet.account.address
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (yield_amount) => {
      if (yield_amount > 0) {
        toast({
          title: t('rewardReceived'),
          description: `+${yield_amount.toFixed(2)} SHROUK`
        });
      }
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error) => {
      console.error('Yields processing error:', error);
    }
  });

  // Buy card mutation
  const buyCardMutation = useMutation({
    mutationFn: async ({ cardId, price, currency }: { cardId: string; price: number; currency: string; }) => {
      if (!wallet?.account?.address) throw new Error('No wallet connected');

      const currentBalance = currency === 'SHROUK' ? (userBalance?.shrouk_balance || 0) : (userBalance?.ton_balance || 0);
      
      if (currentBalance < price) {
        throw new Error('Insufficient balance');
      }

      const existingCard = userCards.find(uc => uc.card_id === cardId);
      if (existingCard) {
        throw new Error('Card already owned');
      }

      // Buy the card
      const { error: insertError } = await supabase.from('user_cards').insert({
        user_address: wallet.account.address,
        card_id: cardId,
        level: 1
      });
      
      if (insertError) throw new Error('Failed to purchase card');

      // Update balance
      const newBalance = currentBalance - price;
      const balanceUpdate = currency === 'SHROUK' ? {
        user_address: wallet.account.address,
        shrouk_balance: newBalance,
        ton_balance: userBalance?.ton_balance || 0
      } : {
        user_address: wallet.account.address,
        ton_balance: newBalance,
        shrouk_balance: userBalance?.shrouk_balance || 0
      };
      
      const { error: balanceError } = await supabase.from('user_balances').upsert(balanceUpdate, {
        onConflict: 'user_address'
      });
      
      if (balanceError) {
        await supabase.from('user_cards').delete()
          .eq('user_address', wallet.account.address)
          .eq('card_id', cardId);
        throw new Error('Failed to update balance');
      }

      return { cardId, price, currency };
    },
    onSuccess: ({ price, currency }) => {
      toast({
        title: t('cardPurchased'),
        description: `${t('purchaseCard')} - ${price.toLocaleString()} ${currency}`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error: any) => {
      let errorMessage = t('purchaseFailed');
      
      if (error.message === 'Insufficient balance') {
        errorMessage = t('insufficientBalance');
      } else if (error.message === 'Card already owned') {
        errorMessage = t('ownedCard');
      }
      
      toast({
        title: t('purchaseFailed'),
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Upgrade card mutation
  const upgradeCardMutation = useMutation({
    mutationFn: async ({ cardId, upgradeCost }: { cardId: string; upgradeCost: number; }) => {
      if (!wallet?.account?.address) throw new Error('No wallet connected');
      const currentBalance = userBalance?.shrouk_balance || 0;
      
      if (currentBalance < upgradeCost) {
        throw new Error('Insufficient balance');
      }

      const { data: currentCard, error: fetchError } = await supabase
        .from('user_cards')
        .select('level')
        .eq('user_address', wallet.account.address)
        .eq('card_id', cardId)
        .single();
      if (fetchError) throw fetchError;

      const { error: upgradeError } = await supabase
        .from('user_cards')
        .update({ level: currentCard.level + 1 })
        .eq('user_address', wallet.account.address)
        .eq('card_id', cardId);
      if (upgradeError) throw upgradeError;

      const { error: balanceError } = await supabase.from('user_balances').upsert({
        user_address: wallet.account.address,
        shrouk_balance: currentBalance - upgradeCost,
        ton_balance: userBalance?.ton_balance || 0
      }, {
        onConflict: 'user_address'
      });
      if (balanceError) throw balanceError;
      
      return { cardId, upgradeCost };
    },
    onSuccess: ({ upgradeCost }) => {
      toast({
        title: t('cardUpgraded'),
        description: `${t('upgradeCost')}: ${upgradeCost} SHROUK`
      });
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error: any) => {
      toast({
        title: t('upgradeFailed'),
        description: error.message === 'Insufficient balance' ? t('insufficientBalance') : t('upgradeFailed'),
        variant: "destructive"
      });
    }
  });

  // Auto-process yields on component mount
  useEffect(() => {
    if (wallet?.account?.address && userCards.length > 0) {
      processYieldsMutation.mutate();
    }
  }, [wallet?.account?.address, userCards.length]);

  const getCardImage = (cardName: string) => {
    const imageMap: { [key: string]: string; } = {
      'Barbie': '/lovable-uploads/625f75fe-4623-4230-8125-6432e904ac65.png',
      'Rapunzel': '/lovable-uploads/56f5cff5-d5b5-4eaf-83e8-99fccd2f939b.png',
      'Elsa': '/lovable-uploads/0ba5cd8b-a167-49c0-808c-f0a06b2585da.png',
      'Cinderella': '/lovable-uploads/bdb34f2a-7c57-4cf2-a618-b945a5556c54.png',
      'Belle': '/lovable-uploads/d18d622b-4fd1-4439-87aa-243f49931369.png',
      'Shrouk': '/lovable-uploads/8649646d-e2d6-47ea-b298-ad95bd603ea0.png'
    };
    return imageMap[cardName] || '/lovable-uploads/b9511081-08ef-4089-85f5-8978bd7b19b9.png';
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-princess-gold';
      default: return 'bg-gray-500';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'rare': return 'border-blue-300 shadow-blue-200';
      case 'epic': return 'border-purple-300 shadow-purple-200';
      case 'legendary': return 'border-princess-gold shadow-yellow-200';
      default: return 'border-gray-300';
    }
  };

  const getOwnedCard = (cardId: string) => {
    return userCards.find(uc => uc.card_id === cardId);
  };

  const getActualHourlyYield = (baseYield: number, level: number) => {
    return baseYield * Math.pow(2, level - 1);
  };

  const getTotalHourlyEarnings = () => {
    return userCards.reduce((total, userCard) => {
      const card = cards.find(c => c.id === userCard.card_id);
      if (card?.currency === 'SHROUK') {
        return total + getActualHourlyYield(card.hourly_yield, userCard.level);
      }
      return total;
    }, 0);
  };

  const canAfford = (price: number, currency: string) => {
    if (!userBalance) return false;
    const balance = currency === 'SHROUK' ? (userBalance.shrouk_balance || 0) : (userBalance.ton_balance || 0);
    return balance >= price;
  };

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
        <div className="space-y-4">
          <Crown className="w-16 h-16 mx-auto text-princess-purple opacity-50" />
          <h2 className="text-xl font-bold text-gray-700">{t('connectWalletToStart')}</h2>
          <p className="text-gray-600">{t('connectWalletFirst')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Hourly Earnings */}
        <Card className="glass-card p-4 bg-gradient-to-br from-princess-pink/20 to-princess-purple/20 border border-princess-gold/30">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-princess-gold animate-pulse" />
              <span className="font-bold text-sm">{t('totalHourlyEarnings')}</span>
            </div>
            <p className="font-bold text-princess-pink text-lg">
              +{getTotalHourlyEarnings().toLocaleString()} SHROUK/{t('perHour')}
            </p>
            <Button 
              onClick={() => processYieldsMutation.mutate()} 
              size="sm" 
              variant="ghost" 
              className="text-xs w-full" 
              disabled={processYieldsMutation.isPending}
            >
              {processYieldsMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{t('collecting')}</span>
                </div>
              ) : (
                t('collectRewards')
              )}
            </Button>
          </div>
        </Card>

        {/* Balance Display */}
        <Card className="glass-card p-4 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 border border-emerald-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-sm">{t('shroukBalance')}</span>
            </div>
            <p className="font-bold text-emerald-700 text-lg">
              {(userBalance?.shrouk_balance || 0).toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600">
              TON: {(userBalance?.ton_balance || 0).toFixed(3)}
            </p>
          </div>
        </Card>
      </div>

      {/* Princess Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {cards.map(card => {
          const ownedCard = getOwnedCard(card.id);
          const isOwned = !!ownedCard;
          const actualYield = isOwned ? getActualHourlyYield(card.hourly_yield, ownedCard.level) : card.hourly_yield;
          const upgradeCost = isOwned ? card.price * ownedCard.level * 2 : 0;
          const canAffordCard = canAfford(card.price, card.currency);
          const canAffordUpgrade = isOwned && canAfford(upgradeCost, 'SHROUK');
          
          return (
            <Card 
              key={card.id} 
              className={`glass-card p-4 border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${
                getRarityBorder(card.rarity)
              } ${
                isOwned 
                  ? 'bg-gradient-to-br from-green-50/40 to-emerald-50/40 border-green-400' 
                  : 'bg-gradient-to-br from-white/20 to-white/10'
              }`}
            >
              <div className="flex gap-4">
                {/* Princess Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-full relative overflow-hidden border-2 border-princess-gold shadow-lg">
                    <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Rarity Badge */}
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    <Badge className={`${getRarityColor(card.rarity)} text-white text-xs px-2 py-0.5 shadow-md`}>
                      {t(card.rarity)}
                    </Badge>
                  </div>

                  {/* Ownership Status */}
                  {isOwned && (
                    <div className="absolute -top-1 -right-1">
                      <div className="bg-green-500 rounded-full p-1">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-gray-800">{card.name}</h3>
                    {isOwned && (
                      <Badge variant="outline" className="text-xs bg-green-50 border-green-300 text-green-700">
                        {t('level')} {ownedCard.level}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/30 rounded-lg p-2 space-y-1">
                      <div className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-princess-gold" />
                        <span className="text-xs font-medium">{t('hourlyYield')}</span>
                      </div>
                      <p className="font-bold text-sm text-princess-purple">
                        {actualYield.toLocaleString()} {card.currency}
                      </p>
                    </div>
                    
                    <div className="bg-white/30 rounded-lg p-2 space-y-1">
                      <div className="flex items-center gap-1">
                        <Crown className="w-3 h-3 text-princess-purple" />
                        <span className="text-xs font-medium">{t('price')}</span>
                      </div>
                      <p className="font-bold text-sm text-princess-pink">
                        {card.price.toLocaleString()} {card.currency}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {!isOwned ? (
                      <Button 
                        onClick={() => buyCardMutation.mutate({ cardId: card.id, price: card.price, currency: card.currency })}
                        size="sm"
                        disabled={buyCardMutation.isPending || !canAffordCard} 
                        className={`w-full h-9 font-bold text-xs transition-all duration-300 ${
                          canAffordCard
                            ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-lg hover:shadow-purple-500/40' 
                            : 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-200 cursor-not-allowed'
                        }`}
                      >
                        {buyCardMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>{t('purchasing')}</span>
                          </div>
                        ) : !canAffordCard ? (
                          <div className="flex items-center gap-2">
                            <Coins className="w-3 h-3" />
                            <span>{t('insufficientBalance')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="w-3 h-3" />
                            <span>{t('purchaseCard')} - {card.price.toLocaleString()} {card.currency}</span>
                          </div>
                        )}
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => upgradeCardMutation.mutate({ cardId: card.id, upgradeCost })}
                        size="sm"
                        className={`w-full h-9 text-xs font-bold transition-all duration-300 ${
                          canAffordUpgrade
                            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-emerald-500/40'
                            : 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-200 cursor-not-allowed'
                        }`}
                        disabled={upgradeCardMutation.isPending || !canAffordUpgrade}
                      >
                        {upgradeCardMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>{t('upgrading')}</span>
                          </div>
                        ) : !canAffordUpgrade ? (
                          <div className="flex items-center gap-2">
                            <Coins className="w-3 h-3" />
                            <span>{t('insufficientBalance')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" />
                            <span>{t('upgradeCard')} → {t('level')} {ownedCard.level + 1} ({upgradeCost.toLocaleString()} SHROUK)</span>
                          </div>
                        )}
                      </Button>
                    )}
                    
                    {/* Status Badge */}
                    <div className={`text-center py-2 px-3 rounded-lg text-xs font-medium ${
                      isOwned 
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200' 
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border border-gray-200'
                    }`}>
                      {isOwned ? (
                        <div className="flex items-center justify-center gap-2">
                          <Crown className="w-3 h-3" />
                          <span>{t('ownedCard')} - {t('currentLevel')}: {ownedCard.level}</span>
                          <div className="flex">
                            {[...Array(Math.min(ownedCard.level, 5))].map((_, i) => (
                              <Star key={i} className="w-2 h-2 text-green-500 fill-current" />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span>{t('notOwned')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
