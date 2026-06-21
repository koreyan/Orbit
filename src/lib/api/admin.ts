"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/admin";

export interface DashboardData {
  totalRevenue: number;
  newOrders: number;
  totalUsers: number;
  totalReports: number;
  revenueByPeriod: { date: string; amount: number }[];
}

export interface Order {
  id: string;
  createdAt: string;
  theme: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  userId: string;
}

export interface User {
  id: string;
  phoneNumber: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export const fetchDashboardData = async (): Promise<DashboardData> => {
  await verifyAdmin();
  const supabase = await createClient();

  const { data: revenueData, error: revError } = await supabase
    .from('orders')
    .select('amount, created_at')
    .eq('status', 'paid');
    
  if (revError) throw new Error('Failed to fetch revenue data');

  const totalRevenue = revenueData.reduce((acc, order) => acc + (order.amount || 0), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: newOrders, error: newOrdersError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());
    
  if (newOrdersError) throw new Error('Failed to fetch new orders');

  const { count: totalUsers, error: usersError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
    
  if (usersError) throw new Error('Failed to fetch total users');

  const { count: totalReports, error: reportsError } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');
    
  if (reportsError) throw new Error('Failed to fetch total reports');

  // 기간별 매출 추이 (최근 7일)
  const periodMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateString = d.toISOString().split('T')[0];
    periodMap.set(dateString, 0);
  }

  revenueData.forEach(order => {
    const orderDate = new Date(order.created_at).toISOString().split('T')[0];
    if (periodMap.has(orderDate)) {
      periodMap.set(orderDate, periodMap.get(orderDate)! + order.amount);
    }
  });

  const revenueByPeriod = Array.from(periodMap.entries()).map(([date, amount]) => ({
    date,
    amount,
  }));

  return {
    totalRevenue,
    newOrders: newOrders || 0,
    totalUsers: totalUsers || 0,
    totalReports: totalReports || 0,
    revenueByPeriod,
  };
};

export const fetchOrders = async (): Promise<Order[]> => {
  await verifyAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, theme, amount, status, user_id')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to fetch orders');

  return data.map((item: any) => ({
    id: item.id,
    createdAt: item.created_at,
    theme: item.theme,
    amount: item.amount,
    status: item.status,
    userId: item.user_id,
  }));
};

export const fetchUsers = async (): Promise<User[]> => {
  await verifyAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('id, phone_number, role, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to fetch users');

  return data.map((item: any) => ({
    id: item.id,
    phoneNumber: item.phone_number,
    role: item.role,
    createdAt: item.created_at,
  }));
};

export const updateOrderStatus = async (id: string, status: string): Promise<void> => {
  await verifyAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error('Failed to update order status');
};
