
import { TonConnectUI } from '@tonconnect/ui-react';
import { Address, beginCell, toNano } from '@ton/core';

export interface TransactionRequest {
  to: string;
  amount: string;
  comment?: string;
}

export class TonService {
  private tonConnectUI: TonConnectUI;

  constructor(tonConnectUI: TonConnectUI) {
    this.tonConnectUI = tonConnectUI;
  }

  async sendTransaction(request: TransactionRequest): Promise<string> {
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 300, // 5 دقائق
      messages: [
        {
          address: request.to,
          amount: toNano(request.amount).toString(),
          payload: request.comment ? 
            beginCell().storeUint(0, 32).storeStringTail(request.comment).endCell().toBoc().toString('base64') : 
            undefined,
        },
      ],
    };

    try {
      const result = await this.tonConnectUI.sendTransaction(transaction);
      console.log('Transaction sent:', result);
      return result.boc;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  async getBalance(address: string): Promise<number> {
    try {
      // استخدام TON API للحصول على الرصيد الحقيقي
      const response = await fetch(`https://toncenter.com/api/v2/getAddressInformation?address=${address}`);
      const data = await response.json();
      
      if (data.ok) {
        return parseFloat(data.result.balance) / 1000000000; // تحويل من nanotons إلى TON
      }
      return 0;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  isValidAddress(address: string): boolean {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }
}
