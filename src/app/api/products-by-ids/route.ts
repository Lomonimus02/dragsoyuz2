import { NextRequest, NextResponse } from "next/server";
import { getProductsByIds } from "@/app/actions/products";

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = [...new Set(idsParam.split(",").map((id) => id.trim()).filter(Boolean))];

  const result = await getProductsByIds(ids);
  return NextResponse.json(result);
}
