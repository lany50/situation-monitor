/**
 * News API - Fetch news from GDELT and other sources
 */

import type { NewsItem, NewsCategory } from '$lib/types';
import { API_DELAYS } from '$lib/config/api';

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// (Removed legacy date parsing; Tavily does not provide pubDate)

// (Removed legacy GDELT transform; Tavily is the primary source)

/**
 * Fetch news for a specific category using GDELT via proxy
 */
export async function fetchCategoryNews(category: NewsCategory): Promise<NewsItem[]> {
	try {
		const endpoint = `/.netlify/functions/tavily-news?category=${encodeURIComponent(category)}`;
		const res = await fetch(endpoint);
		if (!res.ok) {
			return [];
		}
		const data = await res.json();
		const results = (data?.results ?? []) as Array<{ title: string; url: string; content?: string }>;
		const ts = Date.now();
		return results.map((r, index) => ({
			id: `tav-${category}-${index}`,
			title: r.title || r.url || '新闻',
			link: r.url,
			pubDate: undefined,
			timestamp: ts,
			description: r.content?.slice(0, 160),
			content: r.content,
			source: 'Tavily',
			category
		}));
	} catch {
		return [];
	}
}

/** All news categories in fetch order */
const NEWS_CATEGORIES: NewsCategory[] = ['politics', 'tech', 'finance', 'gov', 'ai', 'intel'];

/** Create an empty news result object */
function createEmptyNewsResult(): Record<NewsCategory, NewsItem[]> {
	return { politics: [], tech: [], finance: [], gov: [], ai: [], intel: [] };
}

/**
 * Fetch all news - sequential with delays to avoid rate limiting
 */
export async function fetchAllNews(): Promise<Record<NewsCategory, NewsItem[]>> {
	const result = createEmptyNewsResult();

	for (let i = 0; i < NEWS_CATEGORIES.length; i++) {
		const category = NEWS_CATEGORIES[i];

		if (i > 0) {
			await delay(API_DELAYS.betweenCategories);
		}

		result[category] = await fetchCategoryNews(category);
	}

	return result;
}
