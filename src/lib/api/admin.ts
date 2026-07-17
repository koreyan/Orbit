"use server";

import { verifyAdmin } from "@/lib/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// 관리자 전용 우회 클라이언트 (RLS 무시)
const getAdminSupabase = async () => createSupabaseAdminClient();

export interface DashboardData {
  totalRevenue: number;
  newOrders: number;
  totalUsers: number;
  totalReports: number;
  revenueByPeriod: { date: string; amount: number }[];
}

export interface User {
  id: string;
  phoneNumber: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export const fetchDashboardData = async (): Promise<DashboardData> => {
  await verifyAdmin();
  const adminDb = await getAdminSupabase();

  const { data: revenueData, error: revError } = await adminDb
    .from('orders')
    .select('amount, created_at')
    .eq('status', 'paid');
    
  if (revError) throw new Error('Failed to fetch revenue data');

  const totalRevenue = revenueData.reduce((acc, order) => acc + (order.amount || 0), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: newOrders, error: newOrdersError } = await adminDb
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());
    
  if (newOrdersError) throw new Error('Failed to fetch new orders');

  const { count: totalUsers, error: usersError } = await adminDb
    .from('users')
    .select('*', { count: 'exact', head: true });
    
  if (usersError) throw new Error('Failed to fetch total users');

  const { count: totalReports, error: reportsError } = await adminDb
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

export interface Order {
  id: string;
  createdAt: string;
  theme: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  userId: string | null;
  phoneNumber: string;
}

interface OrderRow {
  id: string;
  created_at: string;
  theme: string;
  amount: number;
  status: Order["status"];
  user_id: string | null;
  users?: Array<{ phone_number: string | null }> | { phone_number: string | null } | null;
}

interface UserRow {
  id: string;
  phone_number: string;
  role: User["role"];
  created_at: string;
}

export const fetchOrders = async (): Promise<Order[]> => {
  await verifyAdmin();
  const adminDb = await getAdminSupabase();

  const { data, error } = await adminDb
    .from('orders')
    .select(`
      id, created_at, theme, amount, status, user_id,
      users ( phone_number )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to fetch orders');

  return (data as OrderRow[]).map((item) => ({
    id: item.id,
    createdAt: item.created_at,
    theme: item.theme,
    amount: item.amount,
    status: item.status,
    userId: item.user_id,
    phoneNumber: Array.isArray(item.users)
      ? item.users[0]?.phone_number || '비회원(결제완료 전)'
      : item.users?.phone_number || '비회원(결제완료 전)',
  }));
};

export interface OrderDetail extends Order {
  reportContent: string | null;
  reportStatus: string | null;
}

export const fetchOrderDetail = async (orderId: string): Promise<OrderDetail> => {
  await verifyAdmin();
  const adminDb = await getAdminSupabase();

  const { data: orderData, error: orderError } = await adminDb
    .from('orders')
    .select(`
      id, created_at, theme, amount, status, user_id,
      users ( phone_number )
    `)
    .eq('id', orderId)
    .single();

  if (orderError) throw new Error(`Failed to fetch order: ${orderError.message}`);

  const { data: reportData } = await adminDb
    .from('reports')
    .select('content, status')
    .eq('order_id', orderId)
    .single();

  let markdownContent = reportData?.content?.markdown || null;
  if (!markdownContent && reportData?.content?.core_trait) {
    markdownContent = `
## ${reportData.content.teaser_quote || ''}

### 나의 진짜 모습
${reportData.content.core_trait || ''}

### 테마 인사이트
${reportData.content.theme_insight || ''}

### 다가오는 시기의 운세 흐름
${reportData.content.periodic_insight || ''}
    `.trim();
  }

  return {
    id: orderData.id,
    createdAt: orderData.created_at,
    theme: orderData.theme,
    amount: orderData.amount,
    status: orderData.status,
    userId: orderData.user_id,
    phoneNumber: orderData.users?.[0]?.phone_number || '비회원(결제완료 전)',
    reportContent: markdownContent,
    reportStatus: reportData?.status || null,
  };
};

export const fetchUsers = async (): Promise<User[]> => {
  await verifyAdmin();
  const adminDb = await getAdminSupabase();

  const { data, error } = await adminDb
    .from('users')
    .select('id, phone_number, role, created_at')
    .neq('role', 'admin')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to fetch users');

  return (data as UserRow[]).map((item) => ({
    id: item.id,
    phoneNumber: item.phone_number,
    role: item.role,
    createdAt: item.created_at,
  }));
};

export const updateOrderStatus = async (id: string, status: string): Promise<void> => {
  await verifyAdmin();
  const adminDb = await getAdminSupabase();

  const { error } = await adminDb
    .from('orders')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error('Failed to update order status');
};
