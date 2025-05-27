
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wallet, Coins, ArrowUpDown, Copy } from 'lucide-react';
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

  // Load user balance from Supabase when wallet connects
  useEffect(() => {
    if (wallet?.account?.address) {
      loadUserBalance();
      loadUserTransactions();
    }
  }, [wallet?.account?.address]);

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
        // Create initial balance record
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
        .limit(3);

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
        title: "Address Copied!",
        description: "Wallet address copied to clipboard.",
      });
    }
  };

  const disconnectWallet = () => {
    tonConnectUI.disconnect();
    setShrougBalance(0);
    setTonBalance(0);
    setTransactions([]);
    
    toast({
      title: "Wallet Disconnected!",
      description: "Your TON wallet has been disconnected.",
    });
  };

  // Send a test transaction
  const sendTestTransaction = async () => {
    if (!wallet?.account?.address) return;

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60, // 60 seconds
        messages: [
          {
            address: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c", // Test address
            amount: "1000000", // 0.001 TON in nanotons
          }
        ]
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      
      // Save transaction to database
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_address: wallet.account.address,
          transaction_hash: result.boc,
          transaction_type: 'send',
          amount: 0.001,
          currency: 'TON',
          to_address: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
          status: 'pending'
        });

      if (error) {
        console.error('Error saving transaction:', error);
      }

      toast({
        title: "Transaction Sent!",
        description: "Test transaction has been sent successfully.",
      });

      // Reload transactions
      loadUserTransactions();
    } catch (error) {
      console.error('Transaction failed:', error);
      toast({
        title: "Transaction Failed",
        description: "Failed to send transaction. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!wallet) {
    return (
      <div className="space-y-6">
        <Card className="glass-card p-8 text-center">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-princess-purple" />
          <h2 className="text-xl font-bold mb-2">Connect Your TON Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to manage your $SHROUK and $TON tokens
          </p>
          <div className="flex justify-center">
            <TonConnectButton />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Address */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Wallet Address</p>
            <p className="font-mono text-sm">
              {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-6)}
            </p>
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
            >
              Disconnect
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
          <Coins className="w-8 h-8 mx-auto mb-2 text-blue-500" />
          <h3 className="font-bold text-lg">TON</h3>
          <p className="text-2xl font-bold">{tonBalance.toFixed(4)}</p>
        </Card>
      </div>

      {/* Test Transaction Button */}
      <Card className="glass-card p-4">
        <Button 
          onClick={sendTestTransaction}
          className="w-full princess-button"
        >
          Send Test Transaction (0.001 TON)
        </Button>
      </Card>

      {/* Transaction History */}
      <Card className="glass-card p-4">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5" />
          Recent Transactions
        </h3>
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((tx, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
                <div>
                  <p className="font-medium capitalize">{tx.transaction_type}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Status: {tx.status}
                  </p>
                </div>
                <p className={`font-bold ${tx.transaction_type === 'receive' ? 'text-green-500' : 'text-red-500'}`}>
                  {tx.transaction_type === 'receive' ? '+' : '-'}{tx.amount} {tx.currency}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No transactions yet</p>
          )}
        </div>
      </Card>
    </div>
  );
};
