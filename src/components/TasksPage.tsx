import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTonWallet } from '@tonconnect/ui-react';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: string | null;
  category: 'daily' | 'main' | 'partner' | string;
  link: string | null;
}

interface TaskCompletion {
  id: string;
  task_id: string;
  user_address: string;
  completed_at: string;
  reward_claimed: boolean;
}

export const TasksPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const wallet = useTonWallet();
  const queryClient = useQueryClient();

  // Fetch tasks from database
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
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

  // Fetch user's completed tasks
  const { data: completedTasks = [] } = useQuery({
    queryKey: ['user-task-completions', wallet?.account?.address],
    queryFn: async () => {
      if (!wallet?.account?.address) return [];
      
      const { data, error } = await supabase
        .from('user_task_completions')
        .select('*')
        .eq('user_address', wallet.account.address);
      
      if (error) throw error;
      return data as TaskCompletion[];
    },
    enabled: !!wallet?.account?.address,
  });

  // Complete task mutation with improved error handling
  const completeTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      if (!wallet?.account?.address) {
        throw new Error('No wallet connected');
      }

      console.log('Completing task:', task.id, 'for user:', wallet.account.address);

      // Check if task is already completed
      const isCompleted = completedTasks.some(ct => ct.task_id === task.id);
      if (isCompleted) {
        throw new Error('Task already completed');
      }

      // Open task link if available
      if (task.link) {
        window.open(task.link, '_blank', 'noopener,noreferrer');
        // Add a small delay to ensure the link opens before continuing
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Extract reward amount from string (e.g., "100 SHROUK" -> 100)
      const rewardAmount = task.reward ? parseFloat(task.reward.replace(/[^\d.]/g, '')) || 0 : 0;
      console.log('Reward amount extracted:', rewardAmount);
      
      // Mark task as completed first
      const { error: completionError } = await supabase
        .from('user_task_completions')
        .insert({
          user_address: wallet.account.address,
          task_id: task.id,
          reward_claimed: true
        });
      
      if (completionError) {
        console.error('Task completion error:', completionError);
        throw new Error('Failed to mark task as completed');
      }

      // Update user balance if there's a reward
      if (rewardAmount > 0) {
        try {
          // Get current balance with proper error handling
          const { data: currentBalance, error: balanceError } = await supabase
            .from('user_balances')
            .select('shrouk_balance, ton_balance')
            .eq('user_address', wallet.account.address)
            .maybeSingle();

          if (balanceError && balanceError.code !== 'PGRST116') {
            console.error('Balance fetch error:', balanceError);
            throw balanceError;
          }

          const currentShroug = currentBalance?.shrouk_balance || 0;
          const currentTon = currentBalance?.ton_balance || 0;
          const newBalance = currentShroug + rewardAmount;

          console.log('Updating balance from', currentShroug, 'to', newBalance);

          // Update balance using upsert to avoid conflicts
          const { error: updateError } = await supabase
            .from('user_balances')
            .upsert({
              user_address: wallet.account.address,
              shrouk_balance: newBalance,
              ton_balance: currentTon
            }, {
              onConflict: 'user_address'
            });

          if (updateError) {
            console.error('Balance update error:', updateError);
            throw updateError;
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
            }, {
              onConflict: 'user_address'
            });

          if (tapError) {
            console.error('Error updating tap points:', tapError);
            // Don't throw error for tap points as it's not critical
          }

          // Record transaction
          const { error: transactionError } = await supabase.from('transactions').insert({
            user_address: wallet.account.address,
            transaction_type: 'task_reward',
            amount: rewardAmount,
            currency: 'SHROUK',
            status: 'completed'
          });

          if (transactionError) {
            console.error('Transaction record error:', transactionError);
            // Don't throw error for transaction recording as it's not critical
          }
        } catch (balanceUpdateError) {
          console.error('Error updating balance:', balanceUpdateError);
          // Even if balance update fails, the task is marked as completed
          // We can show a warning to the user
          throw new Error('Task completed but reward may not have been added. Please refresh and check your balance.');
        }
      }
      
      return { task, rewardAmount };
    },
    onSuccess: ({ task, rewardAmount }) => {
      toast({
        title: t('taskCompleted'),
        description: rewardAmount > 0 ? `${t('rewardReceived')} ${rewardAmount} SHROUK` : t('taskCompleted'),
      });
      queryClient.invalidateQueries({ queryKey: ['user-task-completions'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
      queryClient.invalidateQueries({ queryKey: ['user-tap-points'] });
    },
    onError: (error: any) => {
      console.error('Task completion error:', error);
      let errorMessage = t('taskCompletionError');
      
      if (error.message === 'Task already completed') {
        errorMessage = t('taskAlreadyCompleted');
      } else if (error.message === 'No wallet connected') {
        errorMessage = t('connectWalletFirst');
      } else if (error.message.includes('reward may not have been added')) {
        errorMessage = error.message;
      }
      
      toast({
        title: t('taskError'),
        description: errorMessage,
        variant: "destructive"
      });
    },
  });

  const getTasksByCategory = (category: 'daily' | 'main' | 'partner') => {
    return tasks.filter(task => task.category === category);
  };

  const getCompletedCount = (category: 'daily' | 'main' | 'partner') => {
    const categoryTasks = getTasksByCategory(category);
    return categoryTasks.filter(task => 
      completedTasks.some(ct => ct.task_id === task.id)
    ).length;
  };

  const isTaskCompleted = (taskId: string) => {
    return completedTasks.some(ct => ct.task_id === taskId);
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const completed = isTaskCompleted(task.id);
    
    return (
      <Card className="glass-card p-4 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              completed
                ? 'bg-green-100 text-green-600'
                : 'bg-princess-pink/20 text-princess-pink'
            }`}
          >
            <CheckCircle className={`w-6 h-6 ${completed ? '' : 'opacity-30'}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-right">{task.title}</h3>
            <p className="text-sm text-gray-600 mt-1 text-right">
              {task.description}
            </p>
            <p className="text-sm font-medium text-princess-purple mt-1 text-right">
              {t('reward')}: {task.reward || ''}
            </p>
            {task.link && !completed && (
              <div className="flex items-center justify-end gap-1 mt-2">
                <ExternalLink className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-blue-500">{t('clickToStartTask')}</span>
              </div>
            )}
          </div>
          <div>
            {completed ? (
              <Badge className="text-white bg-green-600">
                {t('completed')}
              </Badge>
            ) : (
              <Button 
                onClick={() => completeTaskMutation.mutate(task)}
                size="sm" 
                className="princess-button flex items-center gap-2"
                disabled={completeTaskMutation.isPending || !wallet?.account?.address}
              >
                {completeTaskMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : task.link ? (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    {t('startTask')}
                  </>
                ) : (
                  t('completeTask')
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

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-princess-purple" />
      </div>
    );
  }

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
        {!wallet?.account?.address && (
          <p className="text-sm text-center text-red-600 mt-2">
            {t('connectWalletToCompleteTasks')}
          </p>
        )}
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
            {getTasksByCategory('daily').length === 0 ? (
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
            {getTasksByCategory('main').length === 0 ? (
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
            {getTasksByCategory('partner').length === 0 ? (
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
