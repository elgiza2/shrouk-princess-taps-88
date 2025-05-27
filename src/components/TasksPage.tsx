
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTonWallet } from '@tonconnect/ui-react';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: string | null;
  completed: boolean | null;
  category: 'daily' | 'main' | 'partner' | string;
  link: string | null;
}

interface TasksPageProps {
  onAdminAccess?: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({ onAdminAccess }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const wallet = useTonWallet();

  // Fetch tasks from Supabase
  const { data: tasks, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
  });

  // Update SHROUK balance when task is completed
  const updateShrougBalance = async (rewardAmount: number) => {
    if (!wallet?.account?.address) return;

    try {
      // Get current balance
      const { data: currentBalance, error: balanceError } = await supabase
        .from('user_balances')
        .select('shrouk_balance')
        .eq('user_address', wallet.account.address)
        .maybeSingle();

      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error('Error fetching current balance:', balanceError);
        return;
      }

      const currentShroug = currentBalance?.shrouk_balance || 0;
      const newBalance = Number(currentShroug) + rewardAmount;

      // Update balance
      const { error: updateError } = await supabase
        .from('user_balances')
        .upsert({
          user_address: wallet.account.address,
          shrouk_balance: newBalance,
          ton_balance: 0
        });

      if (updateError) {
        console.error('Error updating balance:', updateError);
        return;
      }

      // Also update tap points table
      const { error: tapError } = await supabase
        .from('user_tap_points')
        .upsert({
          user_address: wallet.account.address,
          tap_points: newBalance,
          max_taps: 1000,
          tap_upgrade_level: 1,
          tap_value: 0.001
        });

      if (tapError) {
        console.error('Error updating tap points:', tapError);
      }

      console.log('Balance updated successfully:', newBalance);
    } catch (error) {
      console.error('Error in updateShrougBalance:', error);
    }
  };

  // Task completion handler
  const completeTask = async (task: Task) => {
    if (!wallet?.account?.address) {
      toast({
        title: t('noWalletConnected'),
        description: t('connectWalletFirst'),
        variant: "destructive"
      });
      return;
    }

    if (task.link) {
      // Open the task link in a new tab
      window.open(task.link, '_blank', 'noopener,noreferrer');
    }
    
    // Extract reward amount from string (e.g., "100 SHROUK" -> 100)
    const rewardAmount = task.reward ? parseFloat(task.reward.replace(/[^\d.]/g, '')) || 0 : 0;
    
    if (rewardAmount > 0) {
      await updateShrougBalance(rewardAmount);
    }

    // Mark task as completed
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', task.id);

      if (error) {
        console.error('Error marking task as completed:', error);
      } else {
        refetch(); // Refresh tasks list
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
    
    toast({
      title: t('taskCompleted'),
      description: `${t('rewardReceived')} ${task.reward || ''}`,
    });
  };

  const getTasksByCategory = (category: 'daily' | 'main' | 'partner') => {
    return (tasks ?? []).filter(task => task.category === category);
  };

  const getCompletedCount = (category: 'daily' | 'main' | 'partner') => {
    const categoryTasks = getTasksByCategory(category);
    return categoryTasks.filter(t => t.completed).length;
  };

  const TaskCard = ({ task }: { task: Task }) => {
    return (
      <Card className="glass-card p-4 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              task.completed
                ? 'bg-green-100 text-green-600'
                : 'bg-princess-pink/20 text-princess-pink'
            }`}
          >
            {task.completed ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <CheckCircle className="w-6 h-6 opacity-30" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-right">{task.title}</h3>
            <p className="text-sm text-gray-600 mt-1 text-right">
              {task.description}
            </p>
            <p className="text-sm font-medium text-princess-purple mt-1 text-right">
              {t('reward')}: {task.reward || ''}
            </p>
            {task.link && (
              <div className="flex items-center justify-end gap-1 mt-2">
                <ExternalLink className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-blue-500">{t('clickToStartTask')}</span>
              </div>
            )}
          </div>
          <div>
            {task.completed ? (
              <Badge className="text-white bg-green-600">
                {t('completed')}
              </Badge>
            ) : (
              <Button 
                onClick={() => completeTask(task)}
                size="sm" 
                className="princess-button flex items-center gap-2"
                disabled={!task.link}
              >
                {task.link ? (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    {t('startTask')}
                  </>
                ) : (
                  t('comingSoon')
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const CategoryProgress = ({
    category,
  }: {
    category: 'daily' | 'main' | 'partner';
  }) => {
    const categoryTasks = getTasksByCategory(category);
    const completedCount = getCompletedCount(category);
    const totalTasks = categoryTasks.length;

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="bg-princess-pink/20 text-princess-pink">
            {completedCount}/{totalTasks}
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-princess-pink to-princess-purple h-2 rounded-full transition-all duration-300"
            style={{
              width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%`
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card p-4">
        <h2 className="font-bold text-lg text-center">
          {t('taskCenter')}
        </h2>
        <p className="text-sm text-center text-gray-600 mt-2">
          {t('completeTasksAndEarnRewards')}
        </p>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="daily" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="daily">{t('dailyTasks')}</TabsTrigger>
          <TabsTrigger value="main">{t('mainTasks')}</TabsTrigger>
          <TabsTrigger value="partner">{t('partnerTasks')}</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <CategoryProgress category="daily" />
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-center text-muted-foreground">{t('loading')}...</p>
            ) : getTasksByCategory('daily').length === 0 ? (
              <p className="text-sm text-center text-muted-foreground">{t('noDailyTasks')}</p>
            ) : (
              getTasksByCategory('daily').map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="main" className="space-y-4">
          <CategoryProgress category="main" />
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-center text-muted-foreground">{t('loading')}...</p>
            ) : getTasksByCategory('main').length === 0 ? (
              <p className="text-sm text-center text-muted-foreground">{t('noMainTasks')}</p>
            ) : (
              getTasksByCategory('main').map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="partner" className="space-y-4">
          <CategoryProgress category="partner" />
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-center text-muted-foreground">{t('loading')}...</p>
            ) : getTasksByCategory('partner').length === 0 ? (
              <p className="text-sm text-center text-muted-foreground">{t('noPartnerTasks')}</p>
            ) : (
              getTasksByCategory('partner').map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
