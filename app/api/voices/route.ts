import { NextResponse } from "next/server";
import { NarrationService } from "@/lib/narrationService";

export async function GET() {
  try {
    const narrationService = new NarrationService();
    const voices = await narrationService.getAvailableVoices();
    return NextResponse.json(voices);
  } catch (error) {
    console.error("Error fetching voices:", error);
    return NextResponse.json(
      { error: "Failed to fetch voices" },
      { status: 500 }
    );
  }
} 