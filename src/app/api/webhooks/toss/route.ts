import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/error-utils';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Toss Payments Webhook API Route
// 가상계좌 입금 통보, 결제 취소 통보 등의 비동기 이벤트를 처리합니다.
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Toss Payments 이벤트 타입 필터링
    if (payload.eventType !== 'PAYMENT_STATUS_CHANGED' || !payload.data) {
      return NextResponse.json({ message: 'Ignored event' }, { status: 200 });
    }

    const { paymentKey, orderId, status } = payload.data;

    if (!paymentKey || !orderId || !status) {
      return NextResponse.json({ error: 'Missing required payload fields' }, { status: 400 });
    }

    // 보안 및 시스템 접근을 위해 Admin Client (SERVICE_ROLE_KEY) 사용
    const supabaseAdmin = createSupabaseAdminClient();

    // 1. payments 테이블 상태 업데이트 (웹훅으로 넘어온 최신 status 동기화)
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .update({ status: status.toLowerCase() })
      .eq('payment_key', paymentKey);

    if (paymentError) {
      console.error('Webhook: Failed to update payment status', paymentError);
      // 에러가 발생해도 토스 측에 계속 재전송하도록 500을 뱉을 수 있음
      return NextResponse.json({ error: 'Failed to update payment record' }, { status: 500 });
    }

    // 2. orders 테이블 상태 업데이트
    // 입금 완료(DONE) 시 paid로, 취소(CANCELED) 시 canceled로 변경.
    if (status === 'DONE') {
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);
      if (error) console.error("orders DONE error:", error);
    } else if (status === 'CANCELED' || status === 'PARTIAL_CANCELED') {
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      if (error) console.error("orders CANCELED error:", error);
    } else if (status === 'WAITING_FOR_DEPOSIT') {
      // 가상계좌 발급 직후 대기 상태 (이미 pending일 수 있으나 명시적으로 분기 처리 가능)
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: 'pending' })
        .eq('id', orderId);
      if (error) console.error("orders WAITING error:", error);
    }

    // 처리가 성공적으로 완료되면 반드시 200 OK를 반환해야 Toss 측에서 웹훅 재전송을 멈춤
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Webhook Processing Error:', error);
    return NextResponse.json({ error: getErrorMessage(error, 'Internal Server Error') }, { status: 500 });
  }
}
