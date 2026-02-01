/**
 * Onboarding presets for first-time users
 */

import type { PanelId } from './panels';

export interface Preset {
	id: string;
	name: string;
	icon: string;
	description: string;
	panels: PanelId[];
}

export const PRESETS: Record<string, Preset> = {
	'news-junkie': {
		id: 'news-junkie',
		name: '新闻速览',
		icon: '📰',
		description: '快速浏览政治、科技与金融领域的最新新闻',
		panels: ['politics', 'tech', 'finance', 'gov', 'ai', 'mainchar', 'map']
	},
	trader: {
		id: 'trader',
		name: '交易员',
		icon: '📈',
		description: '以市场为中心，包含股票、加密货币与大宗商品',
		panels: [
			'markets',
			'heatmap',
			'commodities',
			'crypto',
			'polymarket',
			'whales',
			'printer',
			'finance',
			'map'
		]
	},
	geopolitics: {
		id: 'geopolitics',
		name: '地缘观察',
		icon: '🌍',
		description: '全球态势与重点地区热点',
		panels: [
			'map',
			'intel',
			'leaders',
			'politics',
			'gov',
			'venezuela',
			'greenland',
			'iran',
			'correlation',
			'narrative'
		]
	},
	intel: {
		id: 'intel',
		name: '情报分析员',
		icon: '🔍',
		description: '深度分析、模式识别与叙事追踪',
		panels: ['map', 'intel', 'leaders', 'correlation', 'narrative', 'mainchar', 'politics']
	},
	minimal: {
		id: 'minimal',
		name: '精简',
		icon: '⚡',
		description: '只保留核心：地图、新闻与市场',
		panels: ['map', 'politics', 'markets']
	},
	everything: {
		id: 'everything',
		name: '全部',
		icon: '🎛️',
		description: '全功能：启用所有面板',
		panels: [
			'map',
			'politics',
			'tech',
			'finance',
			'gov',
			'heatmap',
			'markets',
			'monitors',
			'commodities',
			'crypto',
			'polymarket',
			'whales',
			'mainchar',
			'printer',
			'contracts',
			'ai',
			'layoffs',
			'venezuela',
			'greenland',
			'iran',
			'leaders',
			'intel',
			'correlation',
			'narrative'
		]
	}
};

export const PRESET_ORDER = [
	'news-junkie',
	'trader',
	'geopolitics',
	'intel',
	'minimal',
	'everything'
];

// Storage keys
export const ONBOARDING_STORAGE_KEY = 'onboardingComplete';
export const PRESET_STORAGE_KEY = 'selectedPreset';
