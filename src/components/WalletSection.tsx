
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wallet, Coins, ArrowUpDown, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

export const WalletSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [shrougBalance, setShrougBalance] = useState(0);
  const [tonBalance, setTonBalance] = useState(0);

  useEffect(() => {
    if (wallet) {
      // محاكاة جلب الرصيد
      setShrougBalance(125.4567);
      setTonBalance(2.3456);
      
      toast({
        title: "محفظة TON متصلة!",
        description: "تم ربط محفظة TON بنجاح",
      });
    }
  }, [wallet, toast]);

  const connectWallet = async () => {
    try {
      await tonConnectUI.openModal();
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: "فشل في ربط المحفظة. حاول مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = async () => {
    try {
      await tonConnectUI.disconnect();
      setShrougBalance(0);
      setTonBalance(0);
      
      toast({
        title: "تم قطع الاتصال",
        description: "تم قطع الاتصال بالمحفظة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في قطع الاتصال بالمحفظة",
        variant: "destructive",
      });
    }
  };

  const copyAddress = () => {
    if (wallet?.account?.address) {
      navigator.clipboard.writeText(wallet.account.address);
      toast({
        title: "تم النسخ!",
        description: "تم نسخ عنوان المحفظة إلى الحافظة",
      });
    }
  };

  const openInExplorer = () => {
    if (wallet?.account?.address) {
      window.open(`https://tonscan.org/address/${wallet.account.address}`, '_blank');
    }
  };

  if (!wallet) {
    return (
      <div className="space-y-6">
        <Card className="glass-card p-8 text-center">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-princess-purple" />
          <h2 className="text-xl font-bold mb-2">ربط محفظة TON</h2>
          <p className="text-gray-600 mb-6">
            اربط محفظتك لإدارة رموز $SHROUK و $TON
          </p>
          <Button 
            onClick={connectWallet}
            className="princess-button w-full"
          >
            {t('connectWallet')}
          </Button>
        </Card>

        {/* معلومات إضافية عن المحافظ المدعومة */}
        <Card className="glass-card p-4">
          <h3 className="font-bold mb-3">المحافظ المدعومة</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Tonkeeper</p>
            <p>• TON Wallet</p>
            <p>• OpenMask</p>
            <p>• MyTonWallet</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* معلومات المحفظة */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium">محفظة TON متصلة</p>
              <p className="text-sm text-gray-600">
                {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-6)}
              </p>
            </div>
          </div>
          <Button 
            onClick={disconnectWallet}
            variant="outline" 
            size="sm"
          >
            قطع الاتصال
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={copyAddress}
            variant="ghost" 
            size="sm"
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            نسخ العنوان
          </Button>
          <Button 
            onClick={openInExplorer}
            variant="ghost" 
            size="sm"
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            عرض في المستكشف
          </Button>
        </div>
      </Card>

      {/* أرصدة الرموز */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card p-4 text-center">
          <Coins className="w-8 h-8 mx-auto mb-2 text-princess-gold" />
          <h3 className="font-bold text-lg text-princess-pink">SHROUK</h3>
          <p className="text-2xl font-bold">{shrougBalance.toFixed(4)}</p>
        </Card>

        <Card className="glass-card p-4 text-center">
          <Coins className="w-8 h-8 mx-auto mb-2 text-blue-500" />
          <h3 className="font-bold text-lg">TON</h3>
          <p className="text-2xl font-bold">{tonBalance.toFixed(4)}</p>
        </Card>
      </div>

      {/* سجل المعاملات */}
      <Card className="glass-card p-4">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5" />
          المعاملات الأخيرة
        </h3>
        <div className="space-y-3">
          {[
            { type: 'earned', amount: '+0.025 SHROUK', time: 'منذ دقيقتين' },
            { type: 'earned', amount: '+0.002 TON', time: 'منذ ساعة' },
            { type: 'purchase', amount: '-1.0 TON', time: 'منذ 3 ساعات' },
          ].map((tx, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
              <div>
                <p className="font-medium capitalize">
                  {tx.type === 'earned' ? 'مكسب' : 'شراء'}
                </p>
                <p className="text-sm text-gray-600">{tx.time}</p>
              </div>
              <p className={`font-bold ${tx.type === 'earned' ? 'text-green-500' : 'text-red-500'}`}>
                {tx.amount}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
