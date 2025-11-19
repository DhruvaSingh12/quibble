import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const type = searchParams.get("type");
  const pos = searchParams.get("pos");

  const apiKey = process.env.TENOR_API_KEY;
  const clientKey = "quibble";
  const limit = 20;

  if (!apiKey) {
    return NextResponse.json({ error: "Tenor API key not configured" }, { status: 500 });
  }

  let url = "";
  if (type === "trending") {
    url = `https://tenor.googleapis.com/v2/featured?key=${apiKey}&client_key=${clientKey}&limit=${limit}&media_filter=gif,tinygif`;
  } else if (q) {
    url = `https://tenor.googleapis.com/v2/search?q=${q}&key=${apiKey}&client_key=${clientKey}&limit=${limit}&media_filter=gif,tinygif`;
  } else {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (pos) {
    url += `&pos=${pos}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Tenor API error: ${response.statusText}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching from Tenor:", error);
    return NextResponse.json({ error: "Failed to fetch GIFs" }, { status: 500 });
  }
}
