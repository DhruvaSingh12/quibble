import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const dynamic = 'force-dynamic';

const isValidUrl = (url: string) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export async function GET(request: Request) {
    try {
        const url = new URL(request.url).searchParams.get("url");
        if (!url || !isValidUrl(url)) {
            return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
        }

        // Security check: only allow http and https URLs
        const parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 });
        }

        const response = await fetch(url, {
            headers: {
                "User-Agent": "Quibble Link Preview Bot/1.0",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }

        const html = await response.text();
        const root = parse(html);

        const title = 
            root.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
            root.querySelector('title')?.text || '';

        const description = 
            root.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
            root.querySelector('meta[name="description"]')?.getAttribute('content') || '';

        const image = 
            root.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
            root.querySelector('meta[property="twitter:image"]')?.getAttribute('content') || '';

        const siteName = 
            root.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
            new URL(url).hostname;

        return NextResponse.json({
            success: true,
            metadata: {
                title: title.trim(),
                description: description.trim(),
                image,
                siteName,
                url
            }
        });
    } catch (error) {
        console.error("Error fetching link preview:", error);
        return NextResponse.json(
            { error: "Failed to fetch link preview" },
            { status: 500 }
        );
    }
}
