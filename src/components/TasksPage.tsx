
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, Calendar, Share, ShoppingBag, Gift, Users, Target, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: string;
  completed: boolean;
  icon: React.ComponentType<any>;
  category: 'daily' | 'main' | 'partner';
}

interface TasksPageProps {
  onAdminAccess?: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({ onAdminAccess }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [adminTapCount, setAdminTapCount] = useState(0);
  
  const [tasks, setTasks] = useState<Task[]>([
    // Daily Tasks
    {
      id: 'daily-login',
      title: 'تسجيل دخول يومي',
      description: 'سجل دخولك إلى التطبيق كل يوم',
      reward: '+0.1 SHROUK',
      completed: true,
      icon: Calendar,
      category: 'daily'
    },
    {
      id: 'daily-mining',
      title: 'تعدين يومي',
      description: 'قم بالتعدين لمدة 30 دقيقة يومياً',
      reward: '+0.05 SHROUK',
      completed: false,
      icon: Target,
      category: 'daily'
    },
    
    // Main Tasks
    {
      id: 'buy-card',
      title: 'شراء بطاقة أميرة',
      description: 'قم بشراء أي بطاقة أميرة',
      reward: '+0.5 SHROUK',
      completed: false,
      icon: ShoppingBag,
      category: 'main'
    },
    {
      id: 'complete-all',
      title: 'إكمال جميع المهام',
      description: 'أنهي جميع المهام اليومية للحصول على مكافأة',
      reward: '+1.0 SHROUK + 0.1 TON',
      completed: false,
      icon: Gift,
      category: 'main'
    },
    {
      id: 'reach-level-10',
      title: 'الوصول للمستوى 10',
      description: 'اوصل إلى المستوى 10 في التعدين',
      reward: '+2.0 SHROUK',
      completed: false,
      icon: Star,
      category: 'main'
    },
    
    // Partner Tasks
    {
      id: 'share-app',
      title: 'مشاركة التطبيق',
      description: 'شارك التطبيق مع أصدقائك',
      reward: '+0.2 SHROUK',
      completed: false,
      icon: Share,
      category: 'partner'
    },
    {
      id: 'invite-friends',
      title: 'دعوة 5 أصدقاء',
      description: 'ادع 5 أصدقاء للانضمام',
      reward: '+1.0 SHROUK',
      completed: false,
      icon: Users,
      category: 'partner'
    }
  ]);

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: true } : task
    ));
    
    const task = tasks.find(t => t.id === taskId);
    toast({
      title: "تم إكمال المهمة!",
      description: `المكافأة المحصلة: ${task?.reward}`,
    });
  };

  const handleHeaderTap = () => {
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);
    
    if (newCount >= 5) {
      setAdminTapCount(0);
      onAdminAccess?.();
      toast({
        title: "تم منح صلاحية الأدمن!",
        description: "مرحباً بك في لوحة الأدمن",
      });
    }
  };

  const getTasksByCategory = (category: 'daily' | 'main' | 'partner') => {
    return tasks.filter(task => task.category === category);
  };

  const getCompletedCount = (category: 'daily' | 'main' | 'partner') => {
    const categoryTasks = getTasksByCategory(category);
    return categoryTasks.filter(t => t.completed).length;
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const Icon = task.icon;
    
    return (
      <Card className="glass-card p-4 hover:shadow-lg transition-all duration-300">
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
            <h3 className="font-bold text-right">{task.title}</h3>
            <p className="text-sm text-gray-600 text-right">{task.description}</p>
            <p className="text-sm font-medium text-princess-purple mt-1 text-right">
              {task.reward}
            </p>
          </div>
          
          <div>
            {task.completed ? (
              <Badge className="bg-green-500 text-white">
                مكتملة
              </Badge>
            ) : (
              <Button
                onClick={() => completeTask(task.id)}
                size="sm"
                className="princess-button"
              >
                استلام
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const CategoryProgress = ({ category }: { category: 'daily' | 'main' | 'partner' }) => {
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
            style={{ width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%` }}
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
          onClick={handleHeaderTap}
        >
          مركز المهام
        </h2>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="daily" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="daily">المهام اليومية</TabsTrigger>
          <TabsTrigger value="main">المهام الرئيسية</TabsTrigger>
          <TabsTrigger value="partner">مهام الشركاء</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <CategoryProgress category="daily" />
          <div className="space-y-4">
            {getTasksByCategory('daily').map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="main" className="space-y-4">
          <CategoryProgress category="main" />
          <div className="space-y-4">
            {getTasksByCategory('main').map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="partner" className="space-y-4">
          <CategoryProgress category="partner" />
          <div className="space-y-4">
            {getTasksByCategory('partner').map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
