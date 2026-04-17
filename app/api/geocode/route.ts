import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { geocodeAddress } from "../../../lib/geocode";

const bodySchema = z.object({
  query: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { query } = bodySchema.parse(json);

    const results = await geocodeAddress(query);

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      {
        results: [],
        error: error instanceof Error ? error.message : "Błąd geokodowania",
      },
      { status: 400 }
    );
  }
}
