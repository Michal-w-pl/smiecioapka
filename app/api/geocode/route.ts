import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { geocodeAddress } from "../../../lib/geocode";

const schema = z.object({
  query: z.string().min(2),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Nieprawidłowy adres.' }, { status: 400 });
  }

  const results = await geocodeAddress(parsed.data.query);
  return NextResponse.json({ results });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { geocodeAddress } from "@/lib/geocode";

const bodySchema = z.object({
  query: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { query } = bodySchema.parse(json);

    const results = await geocodeAddress(query);

    return NextResponse.json({
      results,
    });
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
