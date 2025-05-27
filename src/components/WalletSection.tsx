import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wallet, Coins, ArrowUpDown, Copy, ExternalLink, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { TonService } from '@/services/tonService';
import { TransactionService, Transaction } from '@/services/transactionService';
import { SendTransaction } from './SendTransaction';

export const WalletSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [shrougBalance, setShrougBalance] = useState(0);
  const [tonBalance, setTonBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showSendForm, setShowSendForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tonService = new TonService(tonConnectUI);
  const transactionService = new TransactionService();

  // تحديث الرصيد عند اتصال المحفظة
  useEffect(() => {
    if (wallet?.account?.address) {
      refreshBalanceAndTransactions();
      
      toast({
        title: "محفظة TON متصلة!",
        description: "تم ربط محفظة TON بنجاح",
      });

      // إعداد الاستماع للمعاملات الجديدة
      const channel = supabase
        .channel('transactions-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'transactions',
            filter: `user_address=eq.${wallet.account.address}`
          },
          (payload) => {
            console.log('New transaction:', payload);
            refreshBalanceAndTransactions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [wallet, toast]);

  const refreshBalanceAndTransactions = async () => {
    if (!wallet?.account?.address) return;

    setIsRefreshing(true);
    try {
      // الحصول على الرصيد الحقيقي من شبكة TON
      const realTonBalance = await tonService.getBalance(wallet.account.address);
      
      // الحصول على الرصيد المحفوظ في قاعدة البيانات
      const savedBalance = await transactionService.getUserBalance(wallet.account.address);
      
      const currentShrougBalance = savedBalance?.shrougBalance || 0;
      
      // تحديث الأرصدة
      setTonBalance(realTonBalance);
      setShrougBalance(currentShrougBalance);
      
      // حفظ الرصيد المحدث في قاعدة البيانات
      await transactionService.updateUserBalance(
        wallet.account.address, 
        realTonBalance, 
        currentShrougBalance
      );

      // الحصول على المعاملات
      const userTransactions = await transactionService.getTransactionsByAddress(wallet.account.address);
      setTransactions(userTransactions);
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث البيانات",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

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
      setTransactions([]);
      
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
          <div className="flex gap-2">
            <Button 
              onClick={refreshBalanceAndTransactions}
              variant="outline" 
              size="sm"
              disabled={isRefreshing}
            >
              {isRefreshing ? "تحديث..." : "تحديث"}
            </Button>
            <Button 
              onClick={disconnectWallet}
              variant="outline" 
              size="sm"
            >
              قطع الاتصال
            </Button>
          </div>
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

      {/* زر إرسال المعاملات */}
      <Button 
        onClick={() => setShowSendForm(!showSendForm)}
        className="w-full princess-button"
      >
        <Send className="w-4 h-4 mr-2" />
        {showSendForm ? 'إخفاء نموذج الإرسال' : 'إرسال معاملة'}
      </Button>

      {/* نموذج إرسال المعاملات */}
      {showSendForm && <SendTransaction />}

      {/* سجل المعاملات */}
      <Card className="glass-card p-4">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5" />
          المعاملات الأخيرة
        </h3>
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
                <div>
                  <p className="font-medium capitalize">
                    {tx.transaction_type === 'send' ? 'إرسال' : 
                     tx.transaction_type === 'receive' ? 'استلام' : 'مكافأة التعدين'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {tx.status === 'confirmed' ? 'مؤكد' : 
                     tx.status === 'pending' ? 'في الانتظار' : 'فشل'}
                  </p>
                  {tx.transaction_hash && (
                    <p className="text-xs text-blue-500 cursor-pointer" 
                       onClick={() => window.open(`https://tonscan.org/tx/${tx.transaction_hash}`, '_blank')}>
                      عرض في المستكشف
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    tx.transaction_type === 'receive' || tx.transaction_type === 'mining_reward' 
                      ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {tx.transaction_type === 'send' ? '-' : '+'}
                    {tx.amount} {tx.currency}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.created_at!).toLocaleDateString('ar')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">لا توجد معاملات</p>
          )}
        </div>
      </Card>
    </div>
  );
};
