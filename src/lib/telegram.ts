/**
 * 텔레그램 봇 API를 호출하여 지정된 채팅방으로 메시지를 전송합니다.
 * 백그라운드에서 동작하며 실패해도 메인 로직(결제 등)에 영향을 주지 않도록 설계되었습니다.
 */
export async function sendTelegramNotification(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn("Telegram 설정이 누락되어 알림을 전송하지 않습니다.");
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML", // HTML 태그를 이용해 텍스트 서식을 줄 수 있음
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Telegram API Error: ${response.status} - ${errorData}`);
    }
  } catch (error) {
    console.error("Failed to send telegram notification:", error);
  }
}
