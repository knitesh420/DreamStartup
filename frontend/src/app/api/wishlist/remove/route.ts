import { NextRequest, NextResponse } from "next/server";

// This file is kept for backward compatibility
// All requests are handled by the dynamic route at /api/wishlist/remove/[id]/route.ts
export const DELETE = async (req: NextRequest) => {
  return NextResponse.json(
    { success: false, message: "Use /api/wishlist/remove/[id]" },
    { status: 400 },
  );
};
