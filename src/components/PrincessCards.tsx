import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Crown, Coins, Star, Sparkles, Loader2, ShoppingCart, TrendingUp, Zap, Gem } from 'lucide-react';
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
  const {
    t
  } = useLanguage();
  const {
    toast
  } = useToast();
  const wallet = useTonWallet();
  const queryClient = useQueryClient();

  // Fetch cards from database
  const {
    data: cards = [],
    isLoading
  } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('cards').select('*').order('price', {
        ascending: true
      });
      if (error) throw error;

      // Add image URLs and update currency for Shrouk card
      const cardsWithImages = data.map(card => ({
        ...card,
        image: getCardImage(card.name),
        currency: card.name === 'Shrouk' ? 'TON' : 'SHROUK'
      }));
      return cardsWithImages;
    }
  });

  // Fetch user's owned cards
  const {
    data: userCards = []
  } = useQuery({
    queryKey: ['user-cards', wallet?.account?.address],
    queryFn: async () => {
      if (!wallet?.account?.address) return [];
      const {
        data,
        error
      } = await supabase.from('user_cards').select('*, cards(*)').eq('user_address', wallet.account.address);
      if (error) throw error;
      return data || [];
    },
    enabled: !!wallet?.account?.address
  });

  // Fetch user balance
  const {
    data: userBalance
  } = useQuery({
    queryKey: ['user-balance', wallet?.account?.address],
    queryFn: async () => {
      if (!wallet?.account?.address) return null;
      const {
        data,
        error
      } = await supabase.from('user_balances').select('*').eq('user_address', wallet.account.address).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!wallet?.account?.address
  });

  // Process card yields mutation with better error handling
  const processYieldsMutation = useMutation({
    mutationFn: async () => {
      if (!wallet?.account?.address) throw new Error('No wallet connected');
      const { data, error } = await supabase.rpc('process_card_yields', {
        user_addr: wallet.account.address
      });
      if (error) {
        console.error('Process yields error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (yield_amount) => {
      if (yield_amount > 0) {
        toast({
          title: t('yieldsCollected'),
          description: `+${yield_amount.toFixed(2)} SHROUK`
        });
      }
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error) => {
      console.error('Yields processing error:', error);
    }
  });

  // Buy card mutation with improved error handling
  const buyCardMutation = useMutation({
    mutationFn: async ({ cardId, price, currency }: { cardId: string; price: number; currency: string; }) => {
      if (!wallet?.account?.address) throw new Error('No wallet connected');

      console.log('Attempting to buy card:', { cardId, price, currency });

      // Check if user has enough balance with proper fallback values
      const currentBalance = currency === 'SHROUK' ? (userBalance?.shrouk_balance || 0) : (userBalance?.ton_balance || 0);
      console.log('Purchase attempt:', { cardId, price, currency, currentBalance, userBalance });
      
      if (currentBalance < price) {
        throw new Error('Insufficient balance');
      }

      // Check if user already owns this card
      const existingCard = userCards.find(uc => uc.card_id === cardId);
      if (existingCard) {
        throw new Error('Card already owned');
      }

      try {
        // Buy the card
        const { error: insertError } = await supabase.from('user_cards').insert({
          user_address: wallet.account.address,
          card_id: cardId,
          level: 1
        });
        
        if (insertError) {
          console.error('Card purchase error:', insertError);
          throw new Error('Failed to purchase card');
        }

        // Deduct balance using upsert to avoid conflicts
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
          console.error('Balance update error:', balanceError);
          // Try to rollback the card purchase
          await supabase.from('user_cards').delete()
            .eq('user_address', wallet.account.address)
            .eq('card_id', cardId);
          throw new Error('Failed to update balance');
        }

        // Record transaction
        await supabase.from('transactions').insert({
          user_address: wallet.account.address,
          transaction_type: 'purchase',
          amount: price,
          currency: currency,
          status: 'completed'
        });
        
        return { cardId, price, currency };
      } catch (error) {
        console.error('Purchase transaction failed:', error);
        throw error;
      }
    },
    onSuccess: ({ price, currency }) => {
      toast({
        title: t('cardPurchased'),
        description: `${t('cardBoughtFor')} ${price.toLocaleString()} ${currency}`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error: any) => {
      console.error('Purchase error:', error);
      let errorMessage = t('purchaseError');
      
      if (error.message === 'Insufficient balance') {
        errorMessage = t('insufficientBalance');
      } else if (error.message === 'Card already owned') {
        errorMessage = 'هذه البطاقة مملوكة بالفعل';
      } else if (error.message === 'No wallet connected') {
        errorMessage = t('connectWalletFirst');
      }
      
      toast({
        title: t('purchaseFailed'),
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Upgrade card mutation with improved error handling
  const upgradeCardMutation = useMutation({
    mutationFn: async ({ cardId, upgradeCost }: { cardId: string; upgradeCost: number; }) => {
      if (!wallet?.account?.address) throw new Error('No wallet connected');
      const currentBalance = userBalance?.shrouk_balance || 0;
      console.log('Upgrade attempt:', { cardId, upgradeCost, currentBalance });
      
      if (currentBalance < upgradeCost) {
        throw new Error('Insufficient balance');
      }

      // Get current card level first
      const { data: currentCard, error: fetchError } = await supabase
        .from('user_cards')
        .select('level')
        .eq('user_address', wallet.account.address)
        .eq('card_id', cardId)
        .single();
      if (fetchError) {
        console.error('Card fetch error:', fetchError);
        throw fetchError;
      }

      // Upgrade the card
      const { error: upgradeError } = await supabase
        .from('user_cards')
        .update({ level: currentCard.level + 1 })
        .eq('user_address', wallet.account.address)
        .eq('card_id', cardId);
      if (upgradeError) {
        console.error('Card upgrade error:', upgradeError);
        throw upgradeError;
      }

      // Deduct balance using upsert
      const { error: balanceError } = await supabase.from('user_balances').upsert({
        user_address: wallet.account.address,
        shrouk_balance: currentBalance - upgradeCost,
        ton_balance: userBalance?.ton_balance || 0
      }, {
        onConflict: 'user_address'
      });
      if (balanceError) {
        console.error('Balance deduction error:', balanceError);
        throw balanceError;
      }

      // Record transaction
      await supabase.from('transactions').insert({
        user_address: wallet.account.address,
        transaction_type: 'upgrade',
        amount: upgradeCost,
        currency: 'SHROUK',
        status: 'completed'
      });
      
      return { cardId, upgradeCost };
    },
    onSuccess: ({ upgradeCost }) => {
      toast({
        title: t('cardUpgraded'),
        description: `${t('upgradedFor')} ${upgradeCost} SHROUK`
      });
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error: any) => {
      console.error('Upgrade error:', error);
      toast({
        title: t('upgradeFailed'),
        description: error.message === 'Insufficient balance' ? t('insufficientBalance') : t('upgradeError'),
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
    const imageMap: {
      [key: string]: string;
    } = {
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
      case 'common':
        return 'bg-gray-500';
      case 'rare':
        return 'bg-blue-500';
      case 'epic':
        return 'bg-purple-500';
      case 'legendary':
        return 'bg-princess-gold';
      default:
        return 'bg-gray-500';
    }
  };
  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-300';
      case 'rare':
        return 'border-blue-300 shadow-blue-200';
      case 'epic':
        return 'border-purple-300 shadow-purple-200';
      case 'legendary':
        return 'border-princess-gold shadow-yellow-200';
      default:
        return 'border-gray-300';
    }
  };
  const getOwnedCard = (cardId: string) => {
    return userCards.find(uc => uc.card_id === cardId);
  };

  // Calculate actual hourly yield with doubling effect for each level
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
    if (!userBalance) {
      console.log('No user balance available');
      return false;
    }
    const balance = currency === 'SHROUK' ? (userBalance.shrouk_balance || 0) : (userBalance.ton_balance || 0);
    console.log('Balance check:', { price, currency, balance, canAfford: balance >= price });
    return balance >= price;
  };
  const getPurchaseButtonText = (card: PrincessCard) => {
    if (buyCardMutation.isPending) return '';
    if (!canAfford(card.price, card.currency)) return t('insufficientBalance');
    return `${t('buyCard')} - ${card.price.toLocaleString()} ${card.currency}`;
  };
  const getUpgradeButtonText = (ownedCard: any, upgradeCost: number) => {
    if (upgradeCardMutation.isPending) return '';
    if (!canAfford(upgradeCost, 'SHROUK')) return t('insufficientBalance');
    return `${t('upgrade')} → Lv.${ownedCard.level + 1} (${upgradeCost.toLocaleString()} SHROUK)`;
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
        <p className="text-gray-600">{t('connectWalletToViewCards')}</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Total Hourly Earnings */}
      <Card className="glass-card p-4 bg-gradient-to-r from-princess-pink/20 to-princess-purple/20 border border-princess-gold/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-princess-gold animate-pulse" />
            <span className="font-bold text-base">{t('hourlyEarnings')}</span>
          </div>
          <div className="text-right">
            <p className="font-bold text-princess-pink text-sm">
              +{getTotalHourlyEarnings().toLocaleString()} SHROUK/h
            </p>
            <Button 
              onClick={() => processYieldsMutation.mutate()} 
              size="sm" 
              variant="ghost" 
              className="text-xs mt-1" 
              disabled={processYieldsMutation.isPending}
            >
              {processYieldsMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                t('collectYields')
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Debug Balance Info - Remove this in production */}
      {userBalance && (
        <Card className="glass-card p-2 bg-blue-50/20 border border-blue-200">
          <div className="text-xs">
            <p>Debug: SHROUK Balance: {userBalance.shrouk_balance || 0}</p>
            <p>Debug: TON Balance: {userBalance.ton_balance || 0}</p>
          </div>
        </Card>
      )}

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
              className={`glass-card p-4 border-2 shadow-lg ${getRarityBorder(card.rarity)} ${
                isOwned 
                  ? 'bg-gradient-to-br from-green-50/30 to-emerald-50/30 border-green-400' 
                  : 'bg-gradient-to-br from-white/10 to-white/5'
              } hover:shadow-xl transition-all duration-300 hover:scale-[1.01]`}
            >
              <div className="flex items-start gap-4">
                {/* Princess Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-full relative overflow-hidden border-2 border-princess-gold shadow-lg">
                    <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Rarity Badge */}
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    <Badge className={`${getRarityColor(card.rarity)} text-white text-xs px-2 py-0.5 shadow-md`}>
                      {card.rarity}
                    </Badge>
                  </div>
                </div>

                {/* Card Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-gray-800">{card.name}</h3>
                    {isOwned && (
                      <Badge variant="outline" className="text-xs bg-green-50 border-green-300 text-green-700">
                        {t('level')} {ownedCard.level}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="leading-relaxed text-violet-950 text-xs mx-[56px] px-[2px] my-0">{card.description}</p>
                  
                  {/* Stats */}
                  <div className="bg-white/20 rounded-lg p-2 space-y-1 px-0 mx-[66px]">
                    <div className="flex items-center gap-2">
                      <Coins className="w-3 h-3 text-princess-gold" />
                      <span className="font-semibold text-xs">
                        {actualYield.toLocaleString()} {card.currency}/h
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Crown className="w-3 h-3 text-princess-purple" />
                      <span className="font-semibold text-xs">
                        {card.price.toLocaleString()} {card.currency}
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="pt-2 space-y-2">
                    {!isOwned ? (
                      /* Purchase Button with enhanced design */
                      <div className="relative group">
                        <div className={`absolute inset-0 rounded-lg blur opacity-25 group-hover:opacity-40 transition-opacity duration-300 ${
                          canAffordCard ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' : 'bg-gray-400'
                        }`}></div>
                        <Button 
                          onClick={() => buyCardMutation.mutate({ cardId: card.id, price: card.price, currency: card.currency })}
                          size="sm" 
                          disabled={buyCardMutation.isPending || !canAffordCard || !wallet?.account?.address} 
                          className={`relative w-full h-12 font-bold text-sm transition-all duration-300 ${
                            canAffordCard && wallet?.account?.address
                              ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 hover:from-pink-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] border-0 group-hover:shadow-pink-500/30' 
                              : 'bg-gray-300/80 text-gray-600 cursor-not-allowed border border-gray-400'
                          }`}
                        >
                          {buyCardMutation.isPending ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>جاري الشراء...</span>
                            </div>
                          ) : !wallet?.account?.address ? (
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              <span>اربط المحفظة أولاً</span>
                            </div>
                          ) : !canAffordCard ? (
                            <div className="flex items-center gap-2">
                              <Coins className="w-4 h-4" />
                              <span>رصيد غير كافي</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Gem className="w-4 h-4" />
                              <span>شراء - {card.price.toLocaleString()} {card.currency}</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    ) : (
                      /* Upgrade Button with enhanced design */
                      <div className="relative group">
                        <div className={`absolute inset-0 rounded-lg blur opacity-25 group-hover:opacity-40 transition-opacity duration-300 ${
                          canAffordUpgrade ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500' : 'bg-gray-400'
                        }`}></div>
                        <Button 
                          onClick={() => upgradeCardMutation.mutate({ cardId: card.id, upgradeCost })}
                          size="sm" 
                          variant="outline" 
                          className={`relative w-full h-12 text-sm font-bold transition-all duration-300 ${
                            canAffordUpgrade && wallet?.account?.address
                              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-500 text-white border-0 shadow-lg hover:shadow-xl hover:scale-[1.02] group-hover:shadow-emerald-500/30'
                              : 'bg-gray-200/80 text-gray-600 border-gray-400 cursor-not-allowed'
                          }`}
                          disabled={upgradeCardMutation.isPending || !canAffordUpgrade || !wallet?.account?.address}
                        >
                          {upgradeCardMutation.isPending ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>جاري الترقية...</span>
                            </div>
                          ) : !canAffordUpgrade ? (
                            <div className="flex items-center gap-2">
                              <Coins className="w-4 h-4" />
                              <span>رصيد غير كافي للترقية</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              <span>ترقية → Lv.{ownedCard.level + 1} ({upgradeCost.toLocaleString()} SHROUK)</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {/* Additional info for owned cards */}
                    {isOwned && (
                      <div className="text-xs text-center p-2 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-300">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-3 h-3" />
                          <span>مملوكة - المستوى {ownedCard.level}</span>
                        </div>
                      </div>
                    )}
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
