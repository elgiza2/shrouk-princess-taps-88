import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Crown, Coins, Star, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PrincessCard {
  id: string;
  name: string;
  type: 'shrouk' | 'ton';
  hourlyYield: number;
  price: number;
  level: number;
  owned: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
}

export const PrincessCards = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [cards, setCards] = useState<PrincessCard[]>([
    {
      id: '1',
      name: 'Barbie',
      type: 'shrouk',
      hourlyYield: 2000,
      price: 2000,
      level: 1,
      owned: false,
      rarity: 'common',
      description: 'The iconic fashionista princess who brings style and prosperity'
    },
    {
      id: '2',
      name: 'Rapunzel',
      type: 'shrouk',
      hourlyYield: 10000,
      price: 5000,
      level: 1,
      owned: false,
      rarity: 'rare',
      description: 'The tower princess with magical golden hair'
    },
    {
      id: '3',
      name: 'Elsa',
      type: 'shrouk',
      hourlyYield: 20000,
      price: 10000,
      level: 1,
      owned: false,
      rarity: 'epic',
      description: 'The ice queen who controls frost and snow magic'
    },
    {
      id: '4',
      name: 'Cinderella',
      type: 'shrouk',
      hourlyYield: 30000,
      price: 20000,
      level: 1,
      owned: false,
      rarity: 'epic',
      description: 'The glass slipper princess who transforms dreams into reality'
    },
    {
      id: '5',
      name: 'Belle',
      type: 'shrouk',
      hourlyYield: 60000,
      price: 30000,
      level: 1,
      owned: false,
      rarity: 'legendary',
      description: 'The beauty and the beast princess with wisdom and grace'
    },
    {
      id: '6',
      name: 'Shrouk',
      type: 'ton',
      hourlyYield: 200000,
      price: 1,
      level: 1,
      owned: false,
      rarity: 'legendary',
      description: 'The ultimate princess of the SHROUK realm'
    }
  ]);

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
      case 'rare': return 'border-blue-300';
      case 'epic': return 'border-purple-300';
      case 'legendary': return 'border-princess-gold';
      default: return 'border-gray-300';
    }
  };

  const buyCard = (cardId: string) => {
    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, owned: true } : card
    ));
    
    toast({
      title: "Princess Card Purchased!",
      description: "Your new princess is generating hourly rewards!",
    });
  };

  const upgradeCard = (cardId: string) => {
    setCards(prev => prev.map(card => 
      card.id === cardId 
        ? { 
            ...card, 
            level: card.level + 1, 
            hourlyYield: card.hourlyYield * 2, // Double the hourly yield
            price: card.price * 2 // Double the price for next upgrade
          } 
        : card
    ));
    
    toast({
      title: "Princess Upgraded!",
      description: "Hourly yield doubled!",
    });
  };

  return (
    <div className="space-y-6">
      {/* Total Hourly Earnings */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-princess-gold" />
            <span className="font-medium">{t('hourlyEarnings')}</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-princess-pink">
              +{cards.filter(c => c.owned && c.type === 'shrouk')
                     .reduce((sum, c) => sum + c.hourlyYield, 0)
                     .toFixed(4)} SHROUK/h
            </p>
            <p className="text-sm text-blue-500">
              +{cards.filter(c => c.owned && c.type === 'ton')
                     .reduce((sum, c) => sum + c.hourlyYield, 0)
                     .toFixed(4)} TON/h
            </p>
          </div>
        </div>
      </Card>

      {/* Princess Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {cards.map((card) => (
          <Card 
            key={card.id} 
            className={`glass-card p-4 border-2 ${getRarityBorder(card.rarity)} ${
              card.owned ? 'bg-green-50/20' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Princess Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-princess-pink to-princess-purple flex items-center justify-center relative overflow-hidden">
                <Crown className="w-8 h-8 text-white" />
                {card.owned && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <Star className="w-6 h-6 text-green-500" />
                  </div>
                )}
                <div className="absolute -top-1 -right-1">
                  <Badge className={`${getRarityColor(card.rarity)} text-white text-xs px-1`}>
                    {card.rarity}
                  </Badge>
                </div>
              </div>

              {/* Card Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">{card.name}</h3>
                  {card.owned && (
                    <Badge variant="outline" className="text-xs">
                      {t('level')} {card.level}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{card.description}</p>
                
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-princess-gold" />
                    <span className="text-sm">
                      {card.hourlyYield.toFixed(4)} {card.type.toUpperCase()}/h
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-sm">
                      {card.price.toFixed(2)} {card.type.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {!card.owned ? (
                    <Button
                      onClick={() => buyCard(card.id)}
                      size="sm"
                      className="princess-button flex-1"
                    >
                      {t('buyCard')}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => upgradeCard(card.id)}
                      size="sm"
                      variant="outline"
                      className="flex-1 border-princess-purple text-princess-purple hover:bg-princess-purple hover:text-white"
                    >
                      {t('upgrade')} (Lv.{card.level + 1})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
