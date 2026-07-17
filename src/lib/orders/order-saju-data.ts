export interface OrderSajuDataInput {
  date: string;
  time: string;
  gender: "M" | "F";
  location: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isValidDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  return month >= 1 && month <= 12 && day >= 1 && day <= new Date(year, month, 0).getDate();
};

const isValidTime = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(":").map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

const isValidGender = (value: unknown): value is "M" | "F" => value === "M" || value === "F";

export const parseOrderSajuData = (value: unknown): OrderSajuDataInput | null => {
  if (!isRecord(value)) return null;

  const { date, time, gender, location } = value;

  if (!isValidDate(date) || !isValidTime(time) || !isValidGender(gender)) return null;

  return {
    date,
    time,
    gender,
    location: typeof location === "string" ? location : "",
  };
};
