import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, Share, Trophy, Bot, Gift, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ReferralPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [referralStats] = useState({
    totalInvites: 12,
    totalEarned: 6.0,
    rank: 5
  });

  const openBot = () => {
    window.open('https://t.me/shm8bot', '_blank');
  };

  const referralLink = 'https://t.me/shm8bot?start=user123456';
  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link Copied!",
      description: "Referral link copied to clipboard."
    });
  };
  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join SHROUK Mining',
        text: 'Mine crypto with beautiful princess cards!',
        url: referralLink
      });
    } else {
      copyReferralLink();
    }
  };

  const leaderboard = [
    {
      rank: 1,
      name: 'Princess Aria',
      invites: 150,
      earned: '75.0 SHROUK'
    },
    {
      rank: 2,
      name: 'Queen Luna',
      invites: 128,
      earned: '64.0 SHROUK'
    },
    {
      rank: 3,
      name: 'Fairy Rose',
      invites: 95,
      earned: '47.5 SHROUK'
    },
    {
      rank: 4,
      name: 'Star Maiden',
      invites: 67,
      earned: '33.5 SHROUK'
    },
    {
      rank: 5,
      name: 'You',
      invites: referralStats.totalInvites,
      earned: `${referralStats.totalEarned} SHROUK`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card p-3 text-center">
          <Users className="w-6 h-6 mx-auto mb-1 text-princess-pink" />
          <p className="text-sm text-gray-600">Invites</p>
          <p className="text-xl font-bold">{referralStats.totalInvites}</p>
        </Card>
        
        <Card className="glass-card p-3 text-center">
          <Trophy className="w-6 h-6 mx-auto mb-1 text-princess-gold" />
          <p className="text-sm text-gray-600">Earned</p>
          <p className="text-xl font-bold">{referralStats.totalEarned}</p>
        </Card>
        
        <Card className="glass-card p-3 text-center">
          <Share className="w-6 h-6 mx-auto mb-1 text-princess-purple" />
          <p className="text-sm text-gray-600">Rank</p>
          <p className="text-xl font-bold">#{referralStats.rank}</p>
        </Card>
      </div>

      {/* How to Get Referral Link */}
      <Card className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-5 h-5 text-princess-pink" />
          <h3 className="font-bold">كيفية الحصول على رابط الإحالة</h3>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
            <div className="w-6 h-6 bg-princess-pink text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <div>
              <p className="text-sm font-medium">ادخل إلى البوت</p>
              <p className="text-xs text-gray-600">@shm8bot</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-6 h-6 bg-princess-purple text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <div>
              <p className="text-sm font-medium">اكتب الأمر</p>
              <p className="text-xs text-gray-600 font-mono">/princess</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <div className="w-6 h-6 bg-princess-gold text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <div>
              <p className="text-sm font-medium">احصل على رابط الإحالة</p>
              <p className="text-xs text-gray-600">سيرسل لك البوت رابط الإحالة الخاص بك</p>
            </div>
          </div>
        </div>
        
        <Button onClick={openBot} className="princess-button w-full">
          <Bot className="w-4 h-4 mr-2" />
          فتح البوت @shm8bot
        </Button>
      </Card>

      {/* Airdrop Reward */}
      <Card className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-princess-gold" />
          <h3 className="font-bold">مكافأة الإيردروب</h3>
        </div>
        
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">50%</div>
          <p className="text-sm text-gray-700">
            ستحصل على <span className="font-bold">50% مكافأة إضافية</span> وقت الإيردروب!
          </p>
          <p className="text-xs text-gray-600 mt-2">
            كلما دعوت أصدقاء أكثر، كلما زادت مكافآتك
          </p>
        </div>
      </Card>

      {/* Leaderboard */}
      
    </div>
  );
};
