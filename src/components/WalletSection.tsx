import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wallet, Coins, ArrowUpDown, Copy, Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const WalletSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  // Fetch user balance
  const { data: userBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ['user-balance', wallet?.account?.address],
    queryFn: async () => {
      if (!wallet?.account?.address) return null;
      
      const { data, error } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_address', wallet.account.address)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!wallet?.account?.address,
  });

  // Fetch user transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['user-transactions', wallet?.account?.address],
    queryFn: async () => {
      if (!wallet?.account?.address) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_address', wallet.account.address)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!wallet?.account?.address,
  });

  // Initialize user balance mutation with proper error handling
  const initializeBalanceMutation = useMutation({
    mutationFn: async () => {
      if (!wallet?.account?.address) throw new Error('No wallet connected');
      
      // Initialize balance if not exists using upsert
      if (!userBalance) {
        const { error } = await supabase.from('user_balances').upsert({
          user_address: wallet.account.address,
          shrouk_balance: 0,
          ton_balance: 0
        }, {
          onConflict: 'user_address'
        });
        
        if (error) {
          console.error('Balance initialization error:', error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error) => {
      console.error('Balance initialization failed:', error);
      // Don't show error for duplicate key violations as they're expected
      if (!error.message.includes('duplicate key')) {
        toast({
          title: t('initializationError'),
          description: t('couldNotInitializeBalance'),
          variant: "destructive"
        });
      }
    },
  });

  // Fetch real TON balance mutation with better error handling
  const fetchRealTonBalanceMutation = useMutation({
    mutationFn: async () => {
      if (!wallet?.account?.address) throw new Error('No wallet connected');
      
      const response = await fetch(`https://toncenter.com/api/v2/getAddressBalance?address=${wallet.account.address}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.ok || data.result === undefined) {
        throw new Error('Invalid response from TON API');
      }
      
      const realBalance = parseFloat(data.result) / 1e9;
      
      // Update TON balance in database using upsert
      await supabase
        .from('user_balances')
        .upsert({
          user_address: wallet.account.address,
          ton_balance: realBalance,
          shrouk_balance: userBalance?.shrouk_balance || 0
        }, {
          onConflict: 'user_address'
        });
      
      return realBalance;
    },
    onSuccess: (balance) => {
      toast({
        title: t('balanceUpdated'),
        description: `${t('tonBalance')} ${balance.toFixed(4)}`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error) => {
      console.error('TON balance fetch error:', error);
      toast({
        title: t('errorFetchingBalance'),
        description: t('couldNotFetchBalance'),
        variant: "destructive"
      });
    },
  });

  // Send TON transaction mutation with better error handling
  const sendTransactionMutation = useMutation({
    mutationFn: async ({ toAddress, amount }: { toAddress: string; amount: number }) => {
      if (!wallet?.account?.address) throw new Error('No wallet connected');
      
      const amountInNanotons = Math.floor(amount * 1e9).toString();
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: toAddress,
          amount: amountInNanotons
        }]
      };
      
      const result = await tonConnectUI.sendTransaction(transaction);
      
      // Record transaction in database
      await supabase.from('transactions').insert({
        user_address: wallet.account.address,
        transaction_hash: result.boc,
        transaction_type: 'send',
        amount: amount,
        currency: 'TON',
        to_address: toAddress,
        status: 'pending'
      });
      
      return { result, amount, toAddress };
    },
    onSuccess: ({ amount }) => {
      toast({
        title: t('transactionSent'),
        description: `${t('transactionSentSuccess')} ${amount} TON`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-transactions'] });
      
      // Refresh balance after a delay
      setTimeout(() => {
        fetchRealTonBalanceMutation.mutate();
      }, 2000);
    },
    onError: (error) => {
      console.error('Transaction send error:', error);
      toast({
        title: t('transactionFailed'),
        description: t('transactionFailedDescription'),
        variant: "destructive"
      });
    },
  });

  // Track connection status
  useEffect(() => {
    if (wallet?.account?.address) {
      setConnectionStatus('connected');
      toast({
        title: t('walletConnectedSuccessfully'),
        description: `${t('walletAddress')}: ${wallet.account.address.slice(0, 6)}...${wallet.account.address.slice(-6)}`
      });
      
      // Initialize balance if needed
      if (!userBalance) {
        initializeBalanceMutation.mutate();
      }
    } else {
      setConnectionStatus('disconnected');
    }
  }, [wallet?.account?.address]);

  // Monitor TonConnect status changes
  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange(wallet => {
      if (wallet) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    });
    return () => unsubscribe();
  }, [tonConnectUI]);

  const copyAddress = () => {
    if (wallet?.account?.address) {
      navigator.clipboard.writeText(wallet.account.address);
      toast({
        title: t('addressCopied'),
        description: t('walletAddressCopied')
      });
    }
  };

  const disconnectWallet = async () => {
    try {
      setConnectionStatus('connecting');
      await tonConnectUI.disconnect();
      setConnectionStatus('disconnected');
      toast({
        title: t('walletDisconnected'),
        description: t('tonWalletDisconnected')
      });
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: t('transactionFailed'),
        description: t('connectionErrorDescription'),
        variant: "destructive"
      });
    }
  };

  const sendTestTransaction = () => {
    const testAddress = "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N";
    const testAmount = 0.01;
    sendTransactionMutation.mutate({ toAddress: testAddress, amount: testAmount });
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
          <h2 className="text-xl font-bold mb-2">{t('connectTonWallet')}</h2>
          <p className="text-gray-600 mb-6">{t('connectToManage')}</p>
          
          <div className="mb-6">
            <TonConnectButton className="mx-auto" />
          </div>
          
          {connectionStatus === 'error' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{t('connectionError')}</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  const shrougBalance = userBalance?.shrouk_balance || 0;
  const tonBalance = userBalance?.ton_balance || 0;

  return (
    <div className="space-y-6">
      {/* Wallet Address */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm text-gray-600">{t('walletAddress')}</p>
              <p className="font-mono text-sm">
                {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-6)}
              </p>
            </div>
            {getConnectionStatusIcon()}
          </div>
          <div className="flex gap-2">
            <Button onClick={copyAddress} variant="ghost" size="sm">
              <Copy className="w-4 h-4" />
            </Button>
            <Button 
              onClick={disconnectWallet} 
              variant="outline" 
              size="sm" 
              disabled={connectionStatus === 'connecting'}
            >
              {connectionStatus === 'connecting' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('disconnect')
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Token Balances */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card p-4 text-center">
          <h3 className="font-bold text-lg text-princess-pink">SHROUK</h3>
          <p className="text-2xl font-bold">{shrougBalance.toLocaleString()}</p>
          <p className="text-xs mt-1 text-zinc-950">From Mining & Tasks</p>
        </Card>

        <Card className="glass-card p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            {balanceLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
          </div>
          <h3 className="font-bold text-lg">TON</h3>
          <p className="text-2xl font-bold">{tonBalance.toFixed(4)}</p>
          <Button 
            onClick={() => fetchRealTonBalanceMutation.mutate()}
            variant="ghost" 
            size="sm" 
            className="mt-2 text-xs" 
            disabled={fetchRealTonBalanceMutation.isPending}
          >
            {fetchRealTonBalanceMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              t('refreshBalance')
            )}
          </Button>
        </Card>
      </div>

      {/* Transaction Actions */}
      <div className="grid grid-cols-1 gap-4">
        <Button 
          onClick={sendTestTransaction}
          className="princess-button"
          disabled={sendTransactionMutation.isPending}
        >
          {sendTransactionMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Send Test Transaction (0.01 TON)
        </Button>
      </div>

      {/* Transaction History */}
      <Card className="glass-card p-4">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5" />
          {t('recentTransactions')}
        </h3>
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((tx, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0"
              >
                <div>
                  <p className="font-medium">
                    {tx.transaction_type === 'send' ? t('send') : 
                     tx.transaction_type === 'mining' ? t('mining') :
                     tx.transaction_type === 'task_reward' ? t('taskReward') :
                     tx.transaction_type === 'purchase' ? t('purchase') :
                     tx.transaction_type === 'upgrade' ? t('upgrade') :
                     t('receive')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(tx.created_at).toLocaleString('ar-SA')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tx.status === 'pending' ? t('pending') : 
                     tx.status === 'completed' ? t('completed') : 
                     t('failed')}
                  </p>
                  {tx.to_address && (
                    <p className="text-xs text-gray-400 font-mono">
                      {t('to')} {tx.to_address.slice(0, 6)}...{tx.to_address.slice(-6)}
                    </p>
                  )}
                </div>
                <p className={`font-bold ${
                  tx.transaction_type === 'mining' || tx.transaction_type === 'task_reward' ? 'text-green-500' : 
                  tx.transaction_type === 'send' || tx.transaction_type === 'purchase' || tx.transaction_type === 'upgrade' ? 'text-red-500' : 
                  'text-green-500'
                }`}>
                  {tx.transaction_type === 'mining' || tx.transaction_type === 'task_reward' ? '+' : 
                   tx.transaction_type === 'send' || tx.transaction_type === 'purchase' || tx.transaction_type === 'upgrade' ? '-' : 
                   '+'}
                  {tx.amount} {tx.currency}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">{t('noTransactions')}</p>
          )}
        </div>
      </Card>
    </div>
  );
};
