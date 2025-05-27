
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: string | null;
  completed: boolean | null;
  category: 'daily' | 'main' | 'partner' | string;
}

interface TasksPageProps {
  onAdminAccess?: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({ onAdminAccess }) => {
  const { t } = useLanguage();
  const { toast } = useToast();

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

  // Task click now only affects UX/toast, not backend
  const completeTask = (taskId: string) => {
    const task = tasks?.find(t => t.id === taskId);
    toast({
      title: t('taskCompleted'),
      description: `${t('rewardReceived')} ${task?.reward ?? ''}`,
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
      <Card className="glass-card p-4 hover:shadow-lg transition-all duration-300 py-[6px] px-[6px]">
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
            <p className="text-sm font-medium text-princess-purple mt-1 text-right">
              {task.reward || ''}
            </p>
          </div>
          <div>
            {task.completed ? (
              <Badge className="text-white bg-purple-800">
                {t('completed')}
              </Badge>
            ) : (
              <Button 
                onClick={() => completeTask(task.id)}
                size="sm" 
                className="princess-button"
              >
                {t('claim')}
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
        <h2 
          className="font-bold text-lg cursor-pointer select-none text-center" 
        >
          {t('taskCenter')}
        </h2>
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
              <p className="text-sm text-center text-muted-foreground">{t('noTasks')}</p>
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
              <p className="text-sm text-center text-muted-foreground">{t('noTasks')}</p>
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
              <p className="text-sm text-center text-muted-foreground">{t('noTasks')}</p>
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
