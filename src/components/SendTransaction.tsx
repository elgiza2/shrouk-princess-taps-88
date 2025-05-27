
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { TonService } from '@/services/tonService';
import { TransactionService } from '@/services/transactionService';
import { Send, Loader2 } from 'lucide-react';

export const SendTransaction = () => {
  const { toast } = useToast();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    toAddress: '',
    amount: '',
    comment: ''
  });

  const tonService = new TonService(tonConnectUI);
  const transactionService = new TransactionService();

  const handleSendTransaction = async () => {
    if (!wallet?.account?.address) {
      toast({
        title: "خطأ",
        description: "المحفظة غير متصلة",
        variant: "destructive",
      });
      return;
    }

    if (!formData.toAddress || !formData.amount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (!tonService.isValidAddress(formData.toAddress)) {
      toast({
        title: "خطأ",
        description: "عنوان المحفظة غير صالح",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "خطأ",
        description: "مبلغ غير صالح",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // إنشاء معاملة في قاعدة البيانات
      const transaction = await transactionService.createTransaction({
        user_address: wallet.account.address,
        amount: amount,
        currency: 'TON',
        transaction_type: 'send',
        status: 'pending',
        to_address: formData.toAddress,
        from_address: wallet.account.address
      });

      if (!transaction) {
        throw new Error('Failed to create transaction record');
      }

      // إرسال المعاملة إلى شبكة TON
      const boc = await tonService.sendTransaction({
        to: formData.toAddress,
        amount: formData.amount,
        comment: formData.comment
      });

      // تحديث حالة المعاملة
      await transactionService.updateTransactionStatus(transaction.id!, 'confirmed', boc);

      toast({
        title: "نجح الإرسال!",
        description: `تم إرسال ${amount} TON بنجاح`,
      });

      // مسح النموذج
      setFormData({ toAddress: '', amount: '', comment: '' });

    } catch (error: any) {
      console.error('Transaction error:', error);
      
      toast({
        title: "فشل الإرسال",
        description: error.message || "حدث خطأ أثناء إرسال المعاملة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!wallet) {
    return (
      <Card className="glass-card p-4">
        <p className="text-center text-gray-600">يرجى ربط المحفظة أولاً</p>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-4">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <Send className="w-5 h-5" />
        إرسال TON
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">عنوان المستلم</label>
          <Input
            placeholder="EQD..."
            value={formData.toAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, toAddress: e.target.value }))}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">المبلغ (TON)</label>
          <Input
            type="number"
            step="0.001"
            placeholder="0.1"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">تعليق (اختياري)</label>
          <Input
            placeholder="رسالة..."
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            disabled={isLoading}
          />
        </div>

        <Button 
          onClick={handleSendTransaction}
          disabled={isLoading}
          className="w-full princess-button"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              إرسال المعاملة
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
