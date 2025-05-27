import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Crown, Coins, Star, Sparkles, TrendingUp } from 'lucide-react';

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
  image: string;
}
export const PrincessCards = () => {
  const {
    t
  } = useLanguage();
  const [cards, setCards] = useState<PrincessCard[]>([{
    id: '1',
    name: 'Barbie',
    type: 'shrouk',
    hourlyYield: 2000,
    price: 2000,
    level: 1,
    owned: false,
    rarity: 'common',
    description: 'The iconic fashionista princess who brings style and prosperity',
    image: '/lovable-uploads/625f75fe-4623-4230-8125-6432e904ac65.png'
  }, {
    id: '2',
    name: 'Rapunzel',
    type: 'shrouk',
    hourlyYield: 10000,
    price: 5000,
    level: 1,
    owned: false,
    rarity: 'rare',
    description: 'The tower princess with magical golden hair',
    image: '/lovable-uploads/56f5cff5-d5b5-4eaf-83e8-99fccd2f939b.png'
  }, {
    id: '3',
    name: 'Elsa',
    type: 'shrouk',
    hourlyYield: 20000,
    price: 10000,
    level: 1,
    owned: false,
    rarity: 'epic',
    description: 'The ice queen who controls frost and snow magic',
    image: '/lovable-uploads/0ba5cd8b-a167-49c0-808c-f0a06b2585da.png'
  }, {
    id: '4',
    name: 'Cinderella',
    type: 'shrouk',
    hourlyYield: 30000,
    price: 20000,
    level: 1,
    owned: false,
    rarity: 'epic',
    description: 'The glass slipper princess who transforms dreams into reality',
    image: '/lovable-uploads/bdb34f2a-7c57-4cf2-a618-b945a5556c54.png'
  }, {
    id: '5',
    name: 'Belle',
    type: 'shrouk',
    hourlyYield: 60000,
    price: 30000,
    level: 1,
    owned: false,
    rarity: 'legendary',
    description: 'The beauty and the beast princess with wisdom and grace',
    image: '/lovable-uploads/d18d622b-4fd1-4439-87aa-243f49931369.png'
  }, {
    id: '6',
    name: 'Shrouk',
    type: 'ton',
    hourlyYield: 200000,
    price: 1,
    level: 1,
    owned: false,
    rarity: 'legendary',
    description: 'The ultimate princess of the SHROUK realm',
    image: '/lovable-uploads/8649646d-e2d6-47ea-b298-ad95bd603ea0.png'
  }]);
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
  const buyCard = (cardId: string) => {
    setCards(prev => prev.map(card => card.id === cardId ? {
      ...card,
      owned: true
    } : card));
  };
  const upgradeCard = (cardId: string) => {
    setCards(prev => prev.map(card => card.id === cardId ? {
      ...card,
      level: card.level + 1,
      hourlyYield: card.hourlyYield * 2,
      price: card.price * 2
    } : card));
  };
  return <div className="space-y-6">
      {/* Total Hourly Earnings */}
      <Card className="glass-card p-4 bg-gradient-to-r from-princess-pink/20 to-princess-purple/20 border border-princess-gold/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-princess-gold animate-pulse" />
            <span className="font-bold text-lg">{t('hourlyEarnings')}</span>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-princess-pink">
              +{cards.filter(c => c.owned && c.type === 'shrouk').reduce((sum, c) => sum + c.hourlyYield, 0).toFixed(4)} SHROUK/h
            </p>
            <p className="text-lg font-bold text-blue-500">
              +{cards.filter(c => c.owned && c.type === 'ton').reduce((sum, c) => sum + c.hourlyYield, 0).toFixed(4)} TON/h
            </p>
          </div>
        </div>
      </Card>

      {/* Princess Cards Grid */}
      <div className="grid grid-cols-1 gap-6">
        {cards.map(card => <Card key={card.id} className={`glass-card p-6 border-2 shadow-lg ${getRarityBorder(card.rarity)} ${card.owned ? 'bg-gradient-to-br from-green-50/30 to-emerald-50/30 border-green-400' : 'bg-gradient-to-br from-white/10 to-white/5'} hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}>
            <div className="flex items-start gap-6">
              {/* Princess Avatar - محسن ومكبر */}
              <div className="relative flex-shrink-0">
                <div className="w-28 h-28 rounded-full relative overflow-hidden border-3 border-princess-gold shadow-lg">
                  <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                  {card.owned && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-sm">
                      <Star className="w-10 h-10 text-green-500 animate-pulse" />
                    </div>}
                </div>
                
                {/* Rarity Badge - منفصل عن الصورة */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <Badge className={`${getRarityColor(card.rarity)} text-white text-xs px-3 py-1 shadow-md`}>
                    {card.rarity}
                  </Badge>
                </div>
              </div>

              {/* Card Info - محسن */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-xl text-gray-800">{card.name}</h3>
                  {card.owned && <Badge variant="outline" className="text-sm bg-green-50 border-green-300 text-green-700">
                      {t('level')} {card.level}
                    </Badge>}
                </div>
                
                <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
                
                {/* Stats - محسن */}
                <div className="bg-gradient-to-r from-white/30 to-white/10 rounded-xl p-4 space-y-3 border border-white/20 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Hourly Yield</span>
                    </div>
                    <span className="font-bold text-lg text-green-600">
                      {card.hourlyYield.toFixed(4)} {card.type.toUpperCase()}/h
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                        <Coins className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Price</span>
                    </div>
                    <span className="font-bold text-lg text-blue-600">
                      {card.price.toFixed(2)} {card.type.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons - محسن */}
                <div className="flex gap-3 pt-2">
                  {!card.owned ? <Button onClick={() => buyCard(card.id)} size="sm" className="princess-button flex-1 h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300">
                      {t('buyCard')}
                    </Button> : <Button onClick={() => upgradeCard(card.id)} size="sm" variant="outline" className="flex-1 h-12 text-base font-bold border-2 border-princess-purple text-princess-purple hover:bg-princess-purple hover:text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      {t('upgrade')} (Lv.{card.level + 1})
                    </Button>}
                </div>
              </div>
            </div>
          </Card>)}
      </div>
    </div>;
};
