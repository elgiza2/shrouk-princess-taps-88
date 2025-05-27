
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Trash2, Save, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: string | null;
  completed: boolean | null;
  category: string | null;
  link: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const AdminPanel = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load all cards from Supabase
  const { data: cards, isLoading: loadingCards } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Load all tasks from Supabase for display
  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Task[] || [];
    },
  });

  // States for new card and task forms
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);

  const [newCard, setNewCard] = useState({
    name: '',
    currency: 'shrouk',
    hourlyYield: 0,
    price: 0,
    description: '',
    rarity: 'common'
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    reward: '',
    category: 'daily',
    link: ''
  });

  // Add card mutation
  const addCardMutation = useMutation({
    mutationFn: async (card: typeof newCard) => {
      const { data, error } = await supabase.from('cards').insert([
        {
          name: card.name,
          currency: card.currency,
          hourly_yield: card.hourlyYield,
          price: card.price,
          description: card.description,
          rarity: card.rarity
        }
      ]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: t('princessCardAdded'),
        description: `${newCard.name} ${t('cardAddedToCollection')}`,
      });
      setIsAddingCard(false);
      setNewCard({
        name: '',
        currency: 'shrouk',
        hourlyYield: 0,
        price: 0,
        description: '',
        rarity: 'common'
      });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
    onError: () => {
      toast({ title: t('error'), description: t('errorOccurred'), variant: "destructive" });
    }
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (task: typeof newTask) => {
      const { data, error } = await supabase.from('tasks').insert([
        {
          title: task.title,
          description: task.description,
          reward: task.reward,
          category: task.category,
          link: task.link,
          completed: false
        }
      ]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: t('taskAdded'),
        description: t('taskAddedSuccessfully'),
      });
      setIsAddingTask(false);
      setNewTask({
        title: '',
        description: '',
        reward: '',
        category: 'daily',
        link: ''
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => {
      toast({ title: t('error'), description: t('errorOccurred'), variant: "destructive" });
    }
  });

  // Delete card mutation
  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم حذف البطاقة',
        description: 'تم حذف البطاقة بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
    onError: () => {
      toast({ title: t('error'), description: t('errorOccurred'), variant: "destructive" });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم حذف المهمة',
        description: 'تم حذف المهمة بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => {
      toast({ title: t('error'), description: t('errorOccurred'), variant: "destructive" });
    }
  });

  // Add new card handler
  const handleAddCard = () => {
    if (!newCard.name || !newCard.hourlyYield || !newCard.price) {
      toast({
        title: t('missingInformation'),
        description: t('fillAllFields'),
        variant: "destructive"
      });
      return;
    }
    addCardMutation.mutate(newCard);
  };

  // Add new task handler
  const handleAddTask = () => {
    if (!newTask.title || !newTask.reward || !newTask.category || !newTask.link) {
      toast({
        title: t('missingInformation'),
        description: 'يرجى ملء جميع الحقول بما في ذلك الرابط',
        variant: "destructive"
      });
      return;
    }
    addTaskMutation.mutate(newTask);
  };

  // Delete handlers
  const handleDeleteCard = (cardId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه البطاقة؟')) {
      deleteCardMutation.mutate(cardId);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  // UI
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
                  onChange={(e) =>
                    setNewCard(prev => ({
                      ...prev,
                      hourlyYield: parseFloat(e.target.value) || 0
                    }))
                  }
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
                  onChange={(e) =>
                    setNewCard(prev => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0
                    }))
                  }
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
              <Button onClick={handleAddCard} className="princess-button flex-1" disabled={addCardMutation.isPending}>
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

      {/* Add New Task */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">{t('addNewTask')}</h3>
          <Button
            onClick={() => setIsAddingTask(!isAddingTask)}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('addTask')}
          </Button>
        </div>
        {isAddingTask && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taskTitle">عنوان المهمة</Label>
                <Input
                  id="taskTitle"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="مثال: شراء بطاقة"
                />
              </div>
              <div>
                <Label htmlFor="taskCategory">الفئة</Label>
                <Select
                  value={newTask.category}
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">يومية</SelectItem>
                    <SelectItem value="main">رئيسية</SelectItem>
                    <SelectItem value="partner">شراكة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="taskLink">رابط المهمة *</Label>
              <Input
                id="taskLink"
                type="url"
                value={newTask.link}
                onChange={(e) => setNewTask(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://example.com"
                className="text-left"
              />
              <p className="text-xs text-gray-500 mt-1">يجب إدخال رابط صحيح للمهمة</p>
            </div>
            <div>
              <Label htmlFor="taskReward">المكافأة</Label>
              <Input
                id="taskReward"
                value={newTask.reward}
                onChange={(e) => setNewTask(prev => ({ ...prev, reward: e.target.value }))}
                placeholder="+1.0 SHROUK"
              />
            </div>
            <div>
              <Label htmlFor="taskDescription">الوصف</Label>
              <Textarea
                id="taskDescription"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف المهمة..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddTask} className="princess-button flex-1" disabled={addTaskMutation.isPending}>
                <Save className="w-4 h-4 mr-1" />
                {t('save')}
              </Button>
              <Button
                onClick={() => setIsAddingTask(false)}
                variant="outline"
                className="flex-1"
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Cards Management */}
      <Card className="glass-card p-4">
        <h3 className="font-bold mb-4">{t('manageCards')}</h3>
        <div className="space-y-3">
          {loadingCards ? (
            <p className="text-center text-gray-400">{t('loading')}...</p>
          ) : !cards || cards.length === 0 ? (
            <p className="text-center text-muted-foreground">{t('noCards')}</p>
          ) : (
            cards.map((card, index) => (
              <div key={card.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                <div>
                  <p className="font-medium">{card.name}</p>
                  <p className="text-sm text-gray-600">
                    {card.hourly_yield} {card.currency}/h • {card.price} {card.currency}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => handleDeleteCard(card.id)}
                    disabled={deleteCardMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Tasks Management */}
      <Card className="glass-card p-4">
        <h3 className="font-bold mb-4">إدارة المهام</h3>
        <div className="space-y-3">
          {loadingTasks ? (
            <p className="text-center text-gray-400">{t('loading')}...</p>
          ) : !tasks || tasks.length === 0 ? (
            <p className="text-center text-muted-foreground">لا توجد مهام</p>
          ) : (
            tasks.map((task, index) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-gray-600 truncate max-w-xs">{task.description}</p>
                  <p className="text-xs text-princess-purple">الفئة: {task.category}</p>
                  {task.link && (
                    <a 
                      href={task.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      عرض الرابط
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => handleDeleteTask(task.id)}
                    disabled={deleteTaskMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
