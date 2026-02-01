import { TAVILY_API_KEY, TAVILY_BASE_URL, API_DELAYS, logger } from '$lib/config/api';
import type { NewsItem, NewsCategory } from '$lib/types';
import { containsAlertKeyword, detectRegion, detectTopics } from '$lib/config/keywords';

interface TavilyResult {
	title: string;
	url: string;
	content?: string;
	score?: number;
}

interface TavilyResponse {
	results?: TavilyResult[];
	answer?: string;
}

const CATEGORY_QUERIES_ZH: Record<NewsCategory, string> = {
	politics: '国内 政治 时事 新闻 重大事件',
	tech: '国内 科技 人工智能 互联网 新闻',
	finance: '国内 金融 经济 股市 新闻',
	gov: '国内 政府 政策 公告 新闻',
	ai: '国内 人工智能 大模型 科研 新闻',
	intel: '国内 安全 军事 国防 新闻'
};

const DOMESTIC_DOMAINS = [
	'xinhuanet.com',
	'news.cn',
	'cctv.com',
	'people.com.cn',
	'chinadaily.com.cn',
	'thepaper.cn',
	'jiemian.com',
	'caixin.com',
	'36kr.com',
	'ifeng.com',
	'sina.com.cn',
	'sohu.com',
	'qq.com',
	'163.com',
	'yicai.com',
	'cnstock.com',
	'finance.sina.com.cn',
	'finance.qq.com',
	'finance.163.com',
	'news.sina.com.cn'
];

function getHostname(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return '';
	}
}

function isDomestic(url: string): boolean {
	const host = getHostname(url);
	if (!host) return false;
	if (host.endsWith('.cn')) return true;
	return DOMESTIC_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}

async function tavilySearch(query: string, maxResults = 20): Promise<TavilyResponse> {
	try {
		const res = await fetch(TAVILY_BASE_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: TAVILY_API_KEY ? `Bearer ${TAVILY_API_KEY}` : ''
			},
			body: JSON.stringify({
				api_key: TAVILY_API_KEY,
				query,
				search_type: 'news',
				include_domains: DOMESTIC_DOMAINS,
				include_answer: false,
				include_raw_content: false,
				search_depth: 'basic',
				max_results: maxResults
			})
		});

		if (!res.ok) {
			throw new Error(`HTTP ${res.status}: ${res.statusText}`);
		}

		return (await res.json()) as TavilyResponse;
	} catch (error) {
		logger.error('Tavily API', 'Search error:', error);
		return {};
	}
}

export async function fetchCategoryViaTavily(category: NewsCategory): Promise<NewsItem[]> {
	try {
		const query = CATEGORY_QUERIES_ZH[category];
		logger.log('News API', `Fetching ${category} via Tavily`);

		// Small delay between calls to be friendly
		await new Promise((r) => setTimeout(r, API_DELAYS.betweenCategories));

		const data = await tavilySearch(query, 20);
		let results = data.results || [];
		// Prefer domestic sources
		const domestic = results.filter((r) => isDomestic(r.url));
		const others = results.filter((r) => !isDomestic(r.url));
		results = [...domestic, ...others];

		return results.map((r, index) => {
			const title = r.title || r.url || '新闻';
			const alert = containsAlertKeyword(title);
			const ts = Date.now();

			return {
				id: `tav-${category}-${index}`,
				title,
				link: r.url,
				pubDate: undefined,
				timestamp: ts,
				description: r.content?.slice(0, 160),
				content: r.content,
				source: 'Tavily',
				category,
				isAlert: !!alert.isAlert,
				alertKeyword: alert.keyword || undefined,
				region: detectRegion(title) ?? undefined,
				topics: detectTopics(title)
			} as NewsItem;
		});
	} catch (error) {
		logger.error('News API', `Error fetching ${category} via Tavily:`, error);
		return [];
	}
}
