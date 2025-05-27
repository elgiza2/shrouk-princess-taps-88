
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Crown, Coins, Star, Sparkles, Loader2 } from 'lucide-react';
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
      
      // Add image URLs based on card names
      const cardsWithImages = data.map(card => ({
        ...card,
        image: getCardImage(card.name)
      }));
      
      return cardsWithImages;
    },
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
      
      if (error) throw error;
      return data;
    },
    enabled: !!wallet?.account?.address,
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
          title: t('yieldsCollected'),
          description: `+${yield_amount.toFixed(2)} SHROUK`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
  });

  // Buy card mutation
  const buyCardMutation = useMutation({
    mutationFn: async ({ cardId, price, currency }: { cardId: string; price: number; currency: string }) => {
      if (!wallet?.account?.address) throw new Error('No wallet connected');
      
      // Check if user has enough balance
      const currentBalance = userBalance?.[currency.toLowerCase() + '_balance'] || 0;
      if (currentBalance < price) {
        throw new Error('Insufficient balance');
      }
      
      // Buy the card
      const { error: insertError } = await supabase
        .from('user_cards')
        .insert({
          user_address: wallet.account.address,
          card_id: cardId,
          level: 1
        });
      
      if (insertError) throw insertError;
      
      // Deduct balance
      const newBalance = currentBalance - price;
      const balanceUpdate = currency === 'SHROUK' 
        ? { shrouk_balance: newBalance }
        : { ton_balance: newBalance };
      
      const { error: balanceError } = await supabase
        .from('user_balances')
        .upsert({
          user_address: wallet.account.address,
          ...balanceUpdate,
          [currency === 'SHROUK' ? 'ton_balance' : 'shrouk_balance']: 
            userBalance?.[currency === 'SHROUK' ? 'ton_balance' : 'shrouk_balance'] || 0
        });
      
      if (balanceError) throw balanceError;
      
      // Record transaction
      await supabase.from('transactions').insert({
        user_address: wallet.account.address,
        transaction_type: 'purchase',
        amount: price,
        currency: currency,
        status: 'completed'
      });
      
      return { cardId, price, currency };
    },
    onSuccess: ({ price, currency }) => {
      toast({
        title: t('cardPurchased'),
        description: `${t('cardBoughtFor')} ${price} ${currency}`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error: any) => {
      toast({
        title: t('purchaseFailed'),
        description: error.message === 'Insufficient balance' ? t('insufficientBalance') : t('purchaseError'),
        variant: "destructive"
      });
    },
  });

  // Upgrade card mutation
  const upgradeCardMutation = useMutation({
    mutationFn: async ({ cardId, upgradeCost }: { cardId: string; upgradeCost: number }) => {
      if (!wallet?.account?.address) throw new Error('No wallet connected');
      
      const currentBalance = userBalance?.shrouk_balance || 0;
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
      
      if (fetchError) throw fetchError;
      
      // Upgrade the card
      const { error: upgradeError } = await supabase
        .from('user_cards')
        .update({ level: currentCard.level + 1 })
        .eq('user_address', wallet.account.address)
        .eq('card_id', cardId);
      
      if (upgradeError) throw upgradeError;
      
      // Deduct balance
      const { error: balanceError } = await supabase
        .from('user_balances')
        .update({ shrouk_balance: currentBalance - upgradeCost })
        .eq('user_address', wallet.account.address);
      
      if (balanceError) throw balanceError;
      
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
        description: `${t('upgradedFor')} ${upgradeCost} SHROUK`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error: any) => {
      toast({
        title: t('upgradeFailed'),
        description: error.message === 'Insufficient balance' ? t('insufficientBalance') : t('upgradeError'),
        variant: "destructive"
      });
    },
  });

  // Auto-process yields on component mount
  useEffect(() => {
    if (wallet?.account?.address && userCards.length > 0) {
      processYieldsMutation.mutate();
    }
  }, [wallet?.account?.address, userCards.length]);

  const getCardImage = (cardName: string) => {
    const imageMap: { [key: string]: string } = {
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

  const getTotalHourlyEarnings = () => {
    return userCards.reduce((total, userCard) => {
      const card = cards.find(c => c.id === userCard.card_id);
      if (card?.currency === 'SHROUK') {
        return total + (card.hourly_yield * userCard.level);
      }
      return total;
    }, 0);
  };

  const canAfford = (price: number, currency: string) => {
    if (!userBalance) return false;
    const balance = currency === 'SHROUK' ? userBalance.shrouk_balance : userBalance.ton_balance;
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

      {/* Princess Cards Grid */}
      <div className="grid grid-cols-1 gap-6">
        {cards.map(card => {
          const ownedCard = getOwnedCard(card.id);
          const isOwned = !!ownedCard;
          const upgradeCost = isOwned ? card.price * ownedCard.level * 2 : 0;
          
          return (
            <Card 
              key={card.id} 
              className={`glass-card p-6 border-2 shadow-lg ${getRarityBorder(card.rarity)} ${
                isOwned ? 'bg-gradient-to-br from-green-50/30 to-emerald-50/30 border-green-400' : 'bg-gradient-to-br from-white/10 to-white/5'
              } hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="flex items-start gap-6">
                {/* Princess Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-28 h-28 rounded-full relative overflow-hidden border-3 border-princess-gold shadow-lg">
                    <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Rarity Badge */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <Badge className={`${getRarityColor(card.rarity)} text-white text-xs px-3 py-1 shadow-md`}>
                      {card.rarity}
                    </Badge>
                  </div>
                </div>

                {/* Card Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-xl text-gray-800">{card.name}</h3>
                    {isOwned && (
                      <Badge variant="outline" className="text-sm bg-green-50 border-green-300 text-green-700">
                        {t('level')} {ownedCard.level}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm leading-relaxed text-violet-950 text-center">{card.description}</p>
                  
                  {/* Stats */}
                  <div className="bg-white/20 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-princess-gold" />
                      <span className="font-semibold text-xs">
                        {(card.hourly_yield * (isOwned ? ownedCard.level : 1)).toLocaleString()} {card.currency}/h
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-princess-purple" />
                      <span className="font-semibold text-xs">
                        {card.price.toLocaleString()} {card.currency}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    {!isOwned ? (
                      <Button 
                        onClick={() => buyCardMutation.mutate({ 
                          cardId: card.id, 
                          price: card.price, 
                          currency: card.currency 
                        })}
                        size="sm" 
                        className="princess-button flex-1 h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                        disabled={buyCardMutation.isPending || !canAfford(card.price, card.currency)}
                      >
                        {buyCardMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : !canAfford(card.price, card.currency) ? (
                          t('insufficientBalance')
                        ) : (
                          t('buyCard')
                        )}
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => upgradeCardMutation.mutate({ 
                          cardId: card.id, 
                          upgradeCost 
                        })}
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-12 text-base font-bold border-2 border-princess-purple text-princess-purple hover:bg-princess-purple hover:text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        disabled={upgradeCardMutation.isPending || !canAfford(upgradeCost, 'SHROUK')}
                      >
                        {upgradeCardMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : !canAfford(upgradeCost, 'SHROUK') ? (
                          t('insufficientBalance')
                        ) : (
                          `${t('upgrade')} (Lv.${ownedCard.level + 1})`
                        )}
                      </Button>
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
