
import { supabase } from '@/integrations/supabase/client';

export interface Transaction {
  id?: string;
  user_address: string;
  transaction_hash?: string;
  amount: number;
  currency: string;
  transaction_type: 'send' | 'receive' | 'mining_reward';
  status: 'pending' | 'confirmed' | 'failed';
  to_address?: string;
  from_address?: string;
  created_at?: string;
}

export class TransactionService {
  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
  }

  async updateTransactionStatus(id: string, status: 'confirmed' | 'failed', hash?: string): Promise<boolean> {
    try {
      const updateData: any = { status };
      if (hash) updateData.transaction_hash = hash;

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return false;
    }
  }

  async getTransactionsByAddress(address: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_address', address)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  async updateUserBalance(address: string, tonBalance: number, shrougBalance: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_balances')
        .upsert({
          user_address: address,
          ton_balance: tonBalance,
          shrouk_balance: shrougBalance,
          last_updated: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Error updating balance:', error);
      return false;
    }
  }

  async getUserBalance(address: string): Promise<{ tonBalance: number; shrougBalance: number } | null> {
    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('ton_balance, shrouk_balance')
        .eq('user_address', address)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data ? {
        tonBalance: parseFloat(data.ton_balance),
        shrougBalance: parseFloat(data.shrouk_balance)
      } : null;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return null;
    }
  }
}
