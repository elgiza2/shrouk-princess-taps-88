
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, Calendar, Share, ShoppingBag, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: string;
  completed: boolean;
  icon: React.ComponentType<any>;
}

export const TasksPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'daily-login',
      title: t('dailyLogin'),
      description: 'Login to the app every day',
      reward: '+0.1 SHROUK',
      completed: true,
      icon: Calendar
    },
    {
      id: 'share-app',
      title: t('shareApp'),
      description: 'Share the app with your friends',
      reward: '+0.2 SHROUK',
      completed: false,
      icon: Share
    },
    {
      id: 'buy-card',
      title: 'Buy Princess Card',
      description: 'Purchase any princess card',
      reward: '+0.5 SHROUK',
      completed: false,
      icon: ShoppingBag
    },
    {
      id: 'complete-all',
      title: 'Complete All Tasks',
      description: 'Finish all daily tasks for bonus',
      reward: '+1.0 SHROUK + 0.1 TON',
      completed: false,
      icon: Gift
    }
  ]);

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: true } : task
    ));
    
    const task = tasks.find(t => t.id === taskId);
    toast({
      title: "Task Completed!",
      description: `Earned: ${task?.reward}`,
    });
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Daily Tasks</h2>
          <Badge variant="outline" className="bg-princess-pink/20 text-princess-pink">
            {completedCount}/{totalTasks}
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-princess-pink to-princess-purple h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalTasks) * 100}%` }}
          />
        </div>
      </Card>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.map((task) => {
          const Icon = task.icon;
          
          return (
            <Card key={task.id} className="glass-card p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  task.completed 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-princess-pink/20 text-princess-pink'
                }`}>
                  {task.completed ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold">{task.title}</h3>
                  <p className="text-sm text-gray-600">{task.description}</p>
                  <p className="text-sm font-medium text-princess-purple mt-1">
                    {task.reward}
                  </p>
                </div>
                
                <div>
                  {task.completed ? (
                    <Badge className="bg-green-500 text-white">
                      Completed
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => completeTask(task.id)}
                      size="sm"
                      className="princess-button"
                    >
                      Claim
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
