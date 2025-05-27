
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wallet, Coins, ArrowUpDown, Copy, Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { supabase } from '@/integrations/supabase/client';

export const WalletSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const [shrougBalance, setShrougBalance] = useState(0);
  const [tonBalance, setTonBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  // تتبع حالة الاتصال
  useEffect(() => {
    console.log('Wallet connection status changed:', wallet ? 'connected' : 'disconnected');
    console.log('Wallet details:', wallet);

    if (wallet?.account?.address) {
      console.log('Wallet connected successfully:', wallet.account.address);
      setConnectionStatus('connected');
      loadUserBalance();
      loadUserTransactions();
      fetchRealTonBalance();
      
      toast({
        title: "تم ربط المحفظة بنجاح! ✅",
        description: `عنوان المحفظة: ${wallet.account.address.slice(0, 6)}...${wallet.account.address.slice(-6)}`,
      });
    } else {
      console.log('No wallet connected');
      setConnectionStatus('disconnected');
      setShrougBalance(0);
      setTonBalance(0);
      setTransactions([]);
    }
  }, [wallet?.account?.address]);

  // مراقبة حالة TonConnect
  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      console.log('TonConnect status change:', wallet);
      if (wallet) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tonConnectUI]);

  const fetchRealTonBalance = async () => {
    if (!wallet?.account?.address) return;

    setIsLoadingBalance(true);
    try {
      console.log('Fetching balance for:', wallet.account.address);
      
      const response = await fetch(
        `https://toncenter.com/api/v2/getAddressBalance?address=${wallet.account.address}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Balance API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Balance API response:', data);
        
        if (data.ok && data.result !== undefined) {
          const realBalance = parseFloat(data.result) / 1e9;
          console.log('Real balance:', realBalance);
          setTonBalance(realBalance);
          
          await updateTonBalanceInDB(realBalance);
          
          toast({
            title: "تم تحديث الرصيد",
            description: `رصيد TON: ${realBalance.toFixed(4)}`,
          });
        } else {
          console.error('Invalid API response:', data);
          throw new Error('Invalid response from TON API');
        }
      } else {
        console.error('API request failed:', response.status, response.statusText);
        throw new Error(`API request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching real TON balance:', error);
      toast({
        title: "خطأ في جلب الرصيد",
        description: "لم نتمكن من جلب رصيد TON الحقيقي",
        variant: "destructive"
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const updateTonBalanceInDB = async (balance: number) => {
    if (!wallet?.account?.address) return;

    try {
      const { error } = await supabase
        .from('user_balances')
        .upsert({
          user_address: wallet.account.address,
          ton_balance: balance,
          shrouk_balance: shrougBalance
        });

      if (error) {
        console.error('Error updating TON balance in DB:', error);
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  const loadUserBalance = async () => {
    if (!wallet?.account?.address) return;

    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_address', wallet.account.address)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading balance:', error);
        return;
      }

      if (data) {
        setShrougBalance(data.shrouk_balance);
        setTonBalance(data.ton_balance);
      } else {
        const { error: insertError } = await supabase
          .from('user_balances')
          .insert({
            user_address: wallet.account.address,
            shrouk_balance: 0,
            ton_balance: 0
          });

        if (insertError) {
          console.error('Error creating balance:', insertError);
        }
      }
    } catch (error) {
      console.error('Error loading user balance:', error);
    }
  };

  const loadUserTransactions = async () => {
    if (!wallet?.account?.address) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_address', wallet.account.address)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error loading transactions:', error);
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const copyAddress = () => {
    if (wallet?.account?.address) {
      navigator.clipboard.writeText(wallet.account.address);
      toast({
        title: "تم نسخ العنوان! 📋",
        description: "تم نسخ عنوان المحفظة إلى الحافظة.",
      });
    }
  };

  const disconnectWallet = async () => {
    try {
      setConnectionStatus('connecting');
      await tonConnectUI.disconnect();
      setShrougBalance(0);
      setTonBalance(0);
      setTransactions([]);
      setConnectionStatus('disconnected');
      
      toast({
        title: "تم قطع الاتصال! 🔌",
        description: "تم قطع الاتصال بمحفظة TON.",
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setConnectionStatus('error');
      toast({
        title: "خطأ في قطع الاتصال",
        description: "حدث خطأ أثناء قطع الاتصال",
        variant: "destructive"
      });
    }
  };

  const sendRealTonTransaction = async (toAddress: string, amount: number) => {
    if (!wallet?.account?.address) {
      toast({
        title: "لا توجد محفظة متصلة",
        description: "يرجى ربط المحفظة أولاً",
        variant: "destructive"
      });
      return;
    }

    setIsSendingTransaction(true);
    try {
      const amountInNanotons = Math.floor(amount * 1e9).toString();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: toAddress,
            amount: amountInNanotons,
          }
        ]
      };

      console.log('Sending transaction:', transaction);
      const result = await tonConnectUI.sendTransaction(transaction);
      console.log('Transaction result:', result);
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_address: wallet.account.address,
          transaction_hash: result.boc,
          transaction_type: 'send',
          amount: amount,
          currency: 'TON',
          to_address: toAddress,
          status: 'pending'
        });

      if (error) {
        console.error('Error saving transaction:', error);
      }

      toast({
        title: "تم إرسال المعاملة! ✅",
        description: `تم إرسال ${amount} TON بنجاح`,
      });

      setTimeout(() => {
        loadUserTransactions();
        fetchRealTonBalance();
      }, 2000);

    } catch (error) {
      console.error('Transaction failed:', error);
      toast({
        title: "فشل في المعاملة",
        description: "فشل في إرسال المعاملة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setIsSendingTransaction(false);
    }
  };

  const sendTestTransaction = () => {
    const testAddress = "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N";
    const testAmount = 0.01;
    sendRealTonTransaction(testAddress, testAmount);
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'connecting':
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (!wallet) {
    return (
      <div className="space-y-6">
        <Card className="glass-card p-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Wallet className="w-16 h-16 text-princess-purple" />
            {getConnectionStatusIcon()}
          </div>
          <h2 className="text-xl font-bold mb-2">اربط محفظة TON</h2>
          <p className="text-gray-600 mb-6">
            اربط محفظتك لإدارة رموز $SHROUK و $TON الخاصة بك
          </p>
          
          <div className="mb-6">
            <TonConnectButton className="mx-auto" />
          </div>
          
          <div className="text-sm text-gray-500 space-y-2">
            <p>المحافظ المدعومة:</p>
            <div className="flex justify-center gap-2 flex-wrap">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">TON Wallet</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Tonkeeper</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">TON Hub</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">MyTonWallet</span>
            </div>
          </div>
          
          {connectionStatus === 'error' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Address */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm text-gray-600">عنوان المحفظة</p>
              <p className="font-mono text-sm">
                {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-6)}
              </p>
            </div>
            {getConnectionStatusIcon()}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={copyAddress}
              variant="ghost" 
              size="sm"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button 
              onClick={disconnectWallet}
              variant="outline" 
              size="sm"
              disabled={connectionStatus === 'connecting'}
            >
              {connectionStatus === 'connecting' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'قطع الاتصال'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Token Balances */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card p-4 text-center">
          <Coins className="w-8 h-8 mx-auto mb-2 text-princess-gold" />
          <h3 className="font-bold text-lg text-princess-pink">SHROUK</h3>
          <p className="text-2xl font-bold">{shrougBalance.toFixed(4)}</p>
        </Card>

        <Card className="glass-card p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Coins className="w-8 h-8 text-blue-500" />
            {isLoadingBalance && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
          </div>
          <h3 className="font-bold text-lg">TON</h3>
          <p className="text-2xl font-bold">{tonBalance.toFixed(4)}</p>
          <Button 
            onClick={fetchRealTonBalance}
            variant="ghost" 
            size="sm"
            className="mt-2 text-xs"
            disabled={isLoadingBalance}
          >
            تحديث الرصيد
          </Button>
        </Card>
      </div>

      {/* Transaction Actions */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="glass-card p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Send className="w-5 h-5" />
            إرسال معاملة حقيقية
          </h3>
          <Button 
            onClick={sendTestTransaction}
            className="w-full princess-button"
            disabled={isSendingTransaction || tonBalance < 0.01}
          >
            {isSendingTransaction && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            إرسال 0.01 TON (اختبار)
          </Button>
          {tonBalance < 0.01 && (
            <p className="text-sm text-red-500 mt-2 text-center">
              رصيد TON غير كافي للمعاملة
            </p>
          )}
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="glass-card p-4">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5" />
          المعاملات الأخيرة
        </h3>
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((tx, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
                <div>
                  <p className="font-medium">
                    {tx.transaction_type === 'send' ? 'إرسال' : 'استقبال'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(tx.created_at).toLocaleString('ar-SA')}
                  </p>
                  <p className="text-xs text-gray-500">
                    الحالة: {tx.status === 'pending' ? 'معلقة' : tx.status === 'completed' ? 'مكتملة' : 'فاشلة'}
                  </p>
                  {tx.to_address && (
                    <p className="text-xs text-gray-400 font-mono">
                      إلى: {tx.to_address.slice(0, 6)}...{tx.to_address.slice(-6)}
                    </p>
                  )}
                </div>
                <p className={`font-bold ${tx.transaction_type === 'receive' ? 'text-green-500' : 'text-red-500'}`}>
                  {tx.transaction_type === 'receive' ? '+' : '-'}{tx.amount} {tx.currency}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">لا توجد معاملات بعد</p>
          )}
        </div>
      </Card>
    </div>
  );
};
