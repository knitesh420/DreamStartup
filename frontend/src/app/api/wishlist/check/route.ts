import { NextRequest, NextResponse } from "next/server";

// This file is kept for backward compatibility
// All requests are handled by the dynamic route at /api/wishlist/check/[id]/route.ts
export const GET = async (req: NextRequest) => {
  return NextResponse.json(
    { success: false, message: "Use /api/wishlist/check/[id]" },
    { status: 400 },
  );
};
