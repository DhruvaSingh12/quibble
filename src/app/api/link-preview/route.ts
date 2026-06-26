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

        const imageContent =
            root.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
            root.querySelector('meta[property="twitter:image"]')?.getAttribute('content') || '';

        // Validate image URL - ensure it's a valid http/https URL
        let image = '';
        if (imageContent) {
            try {
                // Check for obvious invalid patterns first
                if (imageContent.includes('@') || imageContent.includes('com.') && imageContent.includes('.entities.')) {
                    console.warn(`Skipping malformed image URL: ${imageContent}`);
                } else {
                    const imageUrl = new URL(imageContent, url); // Resolve relative URLs
                    if (['http:', 'https:'].includes(imageUrl.protocol)) {
                        // Additional check: URL path should look like an image or be reasonable
                        const pathname = imageUrl.pathname.toLowerCase();
                        const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(pathname);
                        const hasReasonablePath = !pathname.includes('com.') && !pathname.includes('@');

                        if (hasImageExtension || hasReasonablePath) {
                            image = imageUrl.href;
                        } else {
                            console.warn(`Skipping suspicious image URL: ${imageUrl.href}`);
                        }
                    }
                }
            } catch {
                // Invalid image URL, leave it empty
                console.warn(`Invalid image URL: ${imageContent}`);
            }
        }

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
        return NextResponse.json(
            { success: false, error: "Failed to fetch link preview" },
            { status: 200 }
        );
    }
}
