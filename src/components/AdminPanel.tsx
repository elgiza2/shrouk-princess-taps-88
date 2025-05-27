
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AdminPanel = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCard, setNewCard] = useState({
    name: '',
    currency: 'shrouk',
    hourlyYield: 0,
    price: 0,
    description: '',
    rarity: 'common'
  });

  const handleAddCard = () => {
    if (!newCard.name || !newCard.hourlyYield || !newCard.price) {
      toast({
        title: t('missingInformation'),
        description: t('fillAllFields'),
        variant: "destructive"
      });
      return;
    }

    console.log('Adding new card:', newCard);
    
    toast({
      title: t('princessCardAdded'),
      description: `${newCard.name} ${t('cardAddedToCollection')}`,
    });
    
    setNewCard({
      name: '',
      currency: 'shrouk',
      hourlyYield: 0,
      price: 0,
      description: '',
      rarity: 'common'
    });
    setIsAddingCard(false);
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <Card className="glass-card p-4">
        <h2 className="font-bold text-xl mb-2">{t('adminPanel')}</h2>
        <p className="text-sm text-gray-600">{t('manageCardsAndSettings')}</p>
      </Card>

      {/* Add New Card */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">{t('addNewCard')}</h3>
          <Button 
            onClick={() => setIsAddingCard(!isAddingCard)}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('addCard')}
          </Button>
        </div>

        {isAddingCard && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cardName">{t('cardName')}</Label>
                <Input
                  id="cardName"
                  value={newCard.name}
                  onChange={(e) => setNewCard(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Princess Name"
                />
              </div>
              
              <div>
                <Label htmlFor="rarity">{t('rarity')}</Label>
                <Select 
                  value={newCard.rarity}
                  onValueChange={(value) => setNewCard(prev => ({ ...prev, rarity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">{t('common')}</SelectItem>
                    <SelectItem value="rare">{t('rare')}</SelectItem>
                    <SelectItem value="epic">{t('epic')}</SelectItem>
                    <SelectItem value="legendary">{t('legendary')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourlyYield">{t('hourlyYield')}</Label>
                <Input
                  id="hourlyYield"
                  type="number"
                  step="0.001"
                  value={newCard.hourlyYield}
                  onChange={(e) => setNewCard(prev => ({ ...prev, hourlyYield: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.01"
                />
              </div>
              
              <div>
                <Label htmlFor="price">{t('price')}</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.1"
                  value={newCard.price}
                  onChange={(e) => setNewCard(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="1.0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="currency">{t('currency')}</Label>
              <Select 
                value={newCard.currency}
                onValueChange={(value) => setNewCard(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shrouk">SHROUK</SelectItem>
                  <SelectItem value="ton">TON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                value={newCard.description}
                onChange={(e) => setNewCard(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A magical princess with special powers..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddCard} className="princess-button flex-1">
                <Save className="w-4 h-4 mr-1" />
                {t('save')}
              </Button>
              <Button 
                onClick={() => setIsAddingCard(false)}
                variant="outline" 
                className="flex-1"
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Existing Cards Management */}
      <Card className="glass-card p-4">
        <h3 className="font-bold mb-4">{t('manageCards')}</h3>
        <div className="space-y-3">
          {[
            { name: 'Rose Princess', currency: 'SHROUK', yield: '0.01', price: '1.0' },
            { name: 'Crystal Fairy', currency: 'TON', yield: '0.005', price: '0.1' },
            { name: 'Golden Queen', currency: 'SHROUK', yield: '0.05', price: '10.0' },
          ].map((card, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div>
                <p className="font-medium">{card.name}</p>
                <p className="text-sm text-gray-600">
                  {card.yield} {card.currency}/h • {card.price} {card.currency}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
