import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveSchedule } from '@/lib/providers';

const locationSchema = z.object({
  label: z.string(),
  lat: z.string(),
  lon: z.string(),
  city: z.string(),
  suburb: z.string(),
  road: z.string(),
  houseNumber: z.string(),
  postcode: z.string(),
  county: z.string(),
  state: z.string(),
  municipality: z.string(),
  keyCity: z.string(),
  keySuburb: z.string(),
  keyMunicipality: z.string(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = locationSchema.safeParse(body.location);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Nieprawidłowe dane lokalizacji.' }, { status: 400 });
  }

  const providers = await resolveSchedule(parsed.data);
  return NextResponse.json({ providers });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveProvider } from "@/lib/providers";
import { NormalizedLocation } from "@/lib/types";

const locationSchema = z.object({
  label: z.string(),
  lat: z.string(),
  lon: z.string(),
  city: z.string(),
  suburb: z.string(),
  road: z.string(),
  houseNumber: z.string(),
  postcode: z.string(),
  county: z.string(),
  state: z.string(),
  municipality: z.string(),
  keyCity: z.string(),
  keySuburb: z.string(),
  keyMunicipality: z.string(),
});

const bodySchema = z.object({
  location: locationSchema,
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { location } = bodySchema.parse(json);

    const normalizedLocation = location as NormalizedLocation;
    const provider = resolveProvider(normalizedLocation);
    const result = await provider.getSchedule(normalizedLocation);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Nie udało się pobrać harmonogramu.",
        sourceLinks: [],
      },
      { status: 400 }
    );
  }
}
