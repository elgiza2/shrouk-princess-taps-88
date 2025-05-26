
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wallet, Coins, ArrowUpDown, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const WalletSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [shrougBalance, setShrougBalance] = useState(0);
  const [tonBalance, setTonBalance] = useState(0);

  const connectWallet = () => {
    // Simulate wallet connection
    setIsConnected(true);
    setWalletAddress('UQAqPFXgVhDpXe-WbJgfwVd_ETkmPMqEjLaNKLtDTKxVAJgk');
    setShrougBalance(125.4567);
    setTonBalance(2.3456);
    
    toast({
      title: "Wallet Connected!",
      description: "Your TON wallet has been successfully connected.",
    });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: "Address Copied!",
      description: "Wallet address copied to clipboard.",
    });
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <Card className="glass-card p-8 text-center">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-princess-purple" />
          <h2 className="text-xl font-bold mb-2">Connect Your TON Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to manage your $SHROUK and $TON tokens
          </p>
          <Button 
            onClick={connectWallet}
            className="princess-button w-full"
          >
            {t('connectWallet')}
          </Button>
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
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}
            </p>
          </div>
          <Button 
            onClick={copyAddress}
            variant="ghost" 
            size="sm"
          >
            <Copy className="w-4 h-4" />
          </Button>
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

      {/* Transaction History */}
      <Card className="glass-card p-4">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5" />
          Recent Transactions
        </h3>
        <div className="space-y-3">
          {[
            { type: 'earned', amount: '+0.025 SHROUK', time: '2 min ago' },
            { type: 'earned', amount: '+0.002 TON', time: '1 hour ago' },
            { type: 'purchase', amount: '-1.0 TON', time: '3 hours ago' },
          ].map((tx, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
              <div>
                <p className="font-medium capitalize">{tx.type}</p>
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
