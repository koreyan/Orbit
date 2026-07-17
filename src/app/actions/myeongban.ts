"use server";

import { getMyeongban } from "@/lib/myeongban/get-myeongban";

export async function getMyeongbanAction(params: {
  date: string;
  time: string;
  gender: string;
  location: string;
}) {
  return getMyeongban(params);
}
