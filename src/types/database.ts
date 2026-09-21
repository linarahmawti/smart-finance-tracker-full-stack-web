export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          avatar_url: string | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      pockets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          icon: string;
          color: string;
          target_amount: number;
          initial_balance: number;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          icon?: string;
          color?: string;
          target_amount?: number;
          initial_balance?: number;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          icon?: string;
          color?: string;
          target_amount?: number;
          initial_balance?: number;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'income' | 'expense';
          icon: string;
          color: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'income' | 'expense';
          icon?: string;
          color?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'income' | 'expense';
          icon?: string;
          color?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          pocket_id: string;
          category_id: string;
          type: 'income' | 'expense';
          amount: number;
          title: string;
          description: string | null;
          transaction_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pocket_id: string;
          category_id: string;
          type: 'income' | 'expense';
          amount: number;
          title: string;
          description?: string | null;
          transaction_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pocket_id?: string;
          category_id?: string;
          type?: 'income' | 'expense';
          amount?: number;
          title?: string;
          description?: string | null;
          transaction_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transfers: {
        Row: {
          id: string;
          user_id: string;
          from_pocket_id: string;
          to_pocket_id: string;
          amount: number;
          title: string;
          description: string | null;
          transfer_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          from_pocket_id: string;
          to_pocket_id: string;
          amount: number;
          title?: string;
          description?: string | null;
          transfer_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          from_pocket_id?: string;
          to_pocket_id?: string;
          amount?: number;
          title?: string;
          description?: string | null;
          transfer_date?: string;
          created_at?: string;
        };
      };
    };
  };
}
