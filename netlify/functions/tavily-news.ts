import type { Handler } from '@netlify/functions';

interface TavilyResult {
  title: string;
  url: string;
  content?: string;
  score?: number;
}

interface TavilyResponse {
  results?: TavilyResult[];
}

type NewsCategory = 'politics' | 'tech' | 'finance' | 'gov' | 'ai' | 'intel';

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

export const handler: Handler = async (event) => {
  const apiKey = process.env.VITE_TAVILY_API_KEY || process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Tavily API key not configured' })
    };
  }

  const categoryParam = (event.queryStringParameters?.category || 'politics') as NewsCategory;
  const category: NewsCategory = (['politics','tech','finance','gov','ai','intel'] as NewsCategory[]).includes(categoryParam)
    ? categoryParam
    : 'politics';

  const query = CATEGORY_QUERIES_ZH[category];

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        include_answer: false,
        include_raw_content: false,
        search_depth: 'basic',
        max_results: 20,
        include_domains: DOMESTIC_DOMAINS
      })
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: 'tavily_error', statusText: res.statusText, body: text })
      };
    }

    const data = (await res.json()) as TavilyResponse;
    let results = data.results || [];

    const domestic = results.filter((r) => isDomestic(r.url));
    const others = results.filter((r) => !isDomestic(r.url));
    results = [...domestic, ...others];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60'
      },
      body: JSON.stringify({
        category,
        results
      })
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'internal_error', message: String(error?.message || error) })
    };
  }
};

