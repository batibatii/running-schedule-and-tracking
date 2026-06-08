import { NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { requireAuth } from "@/lib/auth";
import { fetchWeatherForecast } from "@/lib/weather/client";
import { extractErrorMessage } from "@/lib/utils/error";

export async function POST(request: Request) {
  await requireAuth();

  const { latitude, longitude } = (await request.json()) as {
    latitude: number;
    longitude: number;
  };

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json(
      { error: "latitude and longitude are required" },
      { status: 400 },
    );
  }

  try {
    const forecast = await fetchWeatherForecast(latitude, longitude);

    const { text: caption } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system:
        "You write brief, evocative weather captions for a running training app. " +
        "One sentence, under 60 characters. Be specific about conditions that matter " +
        "for runners (wind, humidity, rain timing). Use a warm, encouraging tone. " +
        'Examples: "Breezy Sunday afternoon", "Cool and dry — perfect tempo weather", ' +
        '"Light rain clears by noon".',
      prompt:
        `Current conditions in ${forecast.location}: ${forecast.current.caption}, ` +
        `${Math.round(forecast.current.temp)}°C (feels like ${Math.round(forecast.current.feelsLike)}°C). ` +
        `Today's forecast: high ${forecast.daily[0]?.hi ?? "?"}°C, ` +
        `low ${forecast.daily[0]?.lo ?? "?"}°C, ` +
        `${forecast.daily[0]?.precipitation ?? 0}% chance of rain. ` +
        `Write a brief caption.`,
    });

    // Replace the OWM description caption with Claude's creative one
    forecast.current.caption = caption.replace(/^["']|["']$/g, "");

    return NextResponse.json(forecast);
  } catch (error) {
    const message = extractErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
