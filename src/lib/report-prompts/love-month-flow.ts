interface MonthlyFlowSource {
  month: number;
}

export const getCurrentKoreanMonth = (now: Date = new Date()): number => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    timeZone: "Asia/Seoul",
  });

  return Number(formatter.format(now));
};

export const getMonthlyFlowMonths = <T extends MonthlyFlowSource>({
  liuyue,
  now,
  currentMonth = getCurrentKoreanMonth(now),
}: {
  liuyue: T[];
  now?: Date;
  currentMonth?: number;
}): T[] => {
  return liuyue.filter((ly) => ly.month >= currentMonth);
};

export const getMonthlyFlowRequiredMonths = (currentMonth: number = getCurrentKoreanMonth()): number[] => {
  return Array.from({ length: 13 - currentMonth }, (_, index) => currentMonth + index);
};
