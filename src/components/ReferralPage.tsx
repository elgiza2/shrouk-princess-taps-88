
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, Share, Trophy, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ReferralPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [referralStats] = useState({
    totalInvites: 12,
    totalEarned: 6.0,
    rank: 5
  });

  const referralLink = 'https://t.me/shm8bot?start=user123456';

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link Copied!",
      description: "Referral link copied to clipboard.",
    });
  };

  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join SHROUK Mining',
        text: 'Mine crypto with beautiful princess cards!',
        url: referralLink,
      });
    } else {
      copyReferralLink();
    }
  };

  const leaderboard = [
    { rank: 1, name: 'Princess Aria', invites: 150, earned: '75.0 SHROUK' },
    { rank: 2, name: 'Queen Luna', invites: 128, earned: '64.0 SHROUK' },
    { rank: 3, name: 'Fairy Rose', invites: 95, earned: '47.5 SHROUK' },
    { rank: 4, name: 'Star Maiden', invites: 67, earned: '33.5 SHROUK' },
    { rank: 5, name: 'You', invites: referralStats.totalInvites, earned: `${referralStats.totalEarned} SHROUK` },
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

      {/* Referral Link */}
      <Card className="glass-card p-4">
        <h3 className="font-bold mb-3">{t('inviteFriends')}</h3>
        <p className="text-sm text-gray-600 mb-4">
          Earn +0.5 SHROUK for each friend you invite!
        </p>
        
        <div className="flex gap-2 mb-4">
          <div className="flex-1 p-3 bg-gray-100 rounded-lg">
            <p className="text-sm font-mono text-gray-700 truncate">
              {referralLink}
            </p>
          </div>
          <Button onClick={copyReferralLink} variant="outline" size="sm">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={shareReferralLink} className="princess-button flex-1">
            Share Link
          </Button>
        </div>
      </Card>

      {/* Leaderboard */}
      <Card className="glass-card p-4">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-princess-gold" />
          Referral Leaderboard
        </h3>
        
        <div className="space-y-3">
          {leaderboard.map((user) => (
            <div 
              key={user.rank} 
              className={`flex items-center justify-between p-3 rounded-lg ${
                user.name === 'You' 
                  ? 'bg-princess-pink/20 border border-princess-pink/30' 
                  : 'bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  user.rank <= 3 
                    ? 'bg-princess-gold text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  #{user.rank}
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.invites} invites</p>
                </div>
              </div>
              <p className="font-bold text-princess-purple">{user.earned}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
