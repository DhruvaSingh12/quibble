import { NextResponse } from "next/server";
import { parse } from "node-html-parser";
import { unstable_cache } from "next/cache";

export const dynamic = 'force-dynamic';

const isValidUrl = (url: string) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

const getLinkPreview = async (url: string) => {
    return unstable_cache(
        async () => {
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Quibble Link Preview Bot/1.0",
                },
                // Add an abort signal to prevent hanging requests forever
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.statusText}`);
            }

            const html = await response.text();
            const headHtml = html.slice(0, 50000);
            const root = parse(headHtml);

            const title =
                root.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                root.querySelector('title')?.text || '';

            const description =
                root.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                root.querySelector('meta[name="description"]')?.getAttribute('content') || '';

            const imageContent =
                root.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                root.querySelector('meta[property="twitter:image"]')?.getAttribute('content') || '';

            let image = '';
            if (imageContent) {
                try {
                    if (imageContent.includes('@') || (imageContent.includes('com.') && imageContent.includes('.entities.'))) {
                        console.warn(`Skipping malformed image URL: ${imageContent}`);
                    } else {
                        const imageUrl = new URL(imageContent, url);
                        if (['http:', 'https:'].includes(imageUrl.protocol)) {
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
                    console.warn(`Invalid image URL: ${imageContent}`);
                }
            }

            const siteName =
                root.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
                new URL(url).hostname;

            return {
                title: title.trim(),
                description: description.trim(),
                image,
                siteName,
                url
            };
        },
        ["link-preview", url],
        { revalidate: 60 * 60 * 24 } // cache for 24 hours
    )();
};

export async function GET(request: Request) {
    try {
        const url = new URL(request.url).searchParams.get("url");
        if (!url || !isValidUrl(url)) {
            return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
        }

        const parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 });
        }

        const metadata = await getLinkPreview(url);

        return NextResponse.json({
            success: true,
            metadata
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch link preview" },
            { status: 200 }
        );
    }
}
