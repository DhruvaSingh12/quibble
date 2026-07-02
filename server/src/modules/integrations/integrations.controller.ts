import { Request, Response } from "express";
import { parse } from "node-html-parser";
import { redis } from "../../config/redis";

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const getLinkPreview = async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const parsedUrl = new URL(url);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return res.status(400).json({ error: "Invalid URL protocol" });
  }

  try {
    const cacheKey = `link-preview:${url}`;
    let cachedData = null;
    try {
      cachedData = await redis.get(cacheKey);
    } catch (redisError) {
      // Ignore Redis connection errors so preview can still fetch
    }

    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      headers: { "User-Agent": "Quibble Link Preview Bot/1.0" },
      signal: controller.signal as any,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const headHtml = html.slice(0, 50000);
    const root = parse(headHtml);

    const title = root.querySelector("meta[property='og:title']")?.getAttribute("content") || root.querySelector("title")?.text || "";
    const description = root.querySelector("meta[property='og:description']")?.getAttribute("content") || root.querySelector("meta[name='description']")?.getAttribute("content") || "";
    const imageContent = root.querySelector("meta[property='og:image']")?.getAttribute("content") || root.querySelector("meta[property='twitter:image']")?.getAttribute("content") || "";

    let image = "";
    if (imageContent) {
      try {
        if (!imageContent.includes("@") && !(imageContent.includes("com.") && imageContent.includes(".entities."))) {
          const imageUrl = new URL(imageContent, url);
          if (["http:", "https:"].includes(imageUrl.protocol)) {
            const pathname = imageUrl.pathname.toLowerCase();
            const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(pathname);
            const hasReasonablePath = !pathname.includes("com.") && !pathname.includes("@");

            if (hasImageExtension || hasReasonablePath) {
              image = imageUrl.href;
            }
          }
        }
      } catch { }
    }

    const siteName = root.querySelector("meta[property='og:site_name']")?.getAttribute("content") || new URL(url).hostname;

    const result = {
      success: true,
      metadata: { title: title.trim(), description: description.trim(), image, siteName, url }
    };

    // Cache the result for 24 hours
    try {
      await redis.setex(cacheKey, 86400, JSON.stringify(result));
    } catch (redisError) {
      // Ignore Redis connection errors
    }

    res.json(result);
  } catch (error) {
    res.status(200).json({ success: false, error: "Failed to fetch link preview" });
  }
};

export const getTenorGifs = async (req: Request, res: Response) => {
  const { q, type, pos } = req.query;
  const apiKey = process.env.TENOR_API_KEY;
  const clientKey = "quibble";
  const limit = 20;

  if (!apiKey) return res.status(500).json({ error: "Tenor API key not configured" });

  let url = "";
  if (type === "trending") {
    url = `https://tenor.googleapis.com/v2/featured?key=${apiKey}&client_key=${clientKey}&limit=${limit}&media_filter=gif,tinygif`;
  } else if (q) {
    url = `https://tenor.googleapis.com/v2/search?q=${q}&key=${apiKey}&client_key=${clientKey}&limit=${limit}&media_filter=gif,tinygif`;
  } else {
    return res.status(400).json({ error: "Invalid request" });
  }

  if (pos) url += `&pos=${pos}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Tenor API Error: ${response.status} - ${errorText}`);
      throw new Error(`Tenor API error: ${response.statusText}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Failed to fetch Tenor GIFs:", error.message);
    res.status(500).json({ error: "Failed to fetch GIFs from Tenor API" });
  }
};

