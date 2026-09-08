import { FC, useEffect, useState } from 'react';

interface FontHandlerProps {
	fontFamilies: string[];
}

const GOOGLE_FONT_LINK_ATTRIBUTE = 'data-agenda-google-font';
const GOOGLE_FONT_PRECONNECT_ATTRIBUTE = 'data-agenda-google-font-preconnect';
const GOOGLE_FONT_VARIANTS = ':ital,wght@0,400;0,700;1,400;1,700';
const FONT_REFRESH_INTERVAL_MS = 500;
const FONT_MEASUREMENT_SIZE_PX = 100;
const TARGET_X_HEIGHT_RATIO = 0.52;
const MIN_FONT_SIZE_MULTIPLIER = 0.88;
const MAX_FONT_SIZE_MULTIPLIER = 1.18;

const fontSizeMultiplierCache = new Map<string, number>();

const GENERIC_FONT_FAMILIES = new Set([
	'serif',
	'sans-serif',
	'monospace',
	'cursive',
	'fantasy',
	'system-ui',
	'ui-serif',
	'ui-sans-serif',
	'ui-monospace',
	'ui-rounded',
	'emoji',
	'math',
	'fangsong',
	'inherit',
	'initial',
	'revert',
	'revert-layer',
	'unset',
]);

const splitFontStack = (fontStack: string): string[] => {
	const families: string[] = [];
	let current = '';
	let quote: string | null = null;
	let isEscaped = false;

	for (const character of fontStack) {
		if (isEscaped) {
			current += character;
			isEscaped = false;
			continue;
		}

		if (character === '\\') {
			isEscaped = true;
			current += character;
			continue;
		}

		if (quote) {
			if (character === quote) {
				quote = null;
			}
			current += character;
			continue;
		}

		if (character === '"' || character === "'") {
			quote = character;
			current += character;
			continue;
		}

		if (character === ',') {
			families.push(current);
			current = '';
			continue;
		}

		current += character;
	}

	if (current.trim()) {
		families.push(current);
	}

	return families;
};

const normalizeFontFamily = (fontFamily: string): string => {
	const trimmed = fontFamily.trim();
	const unquoted = (
		(trimmed.startsWith('"') && trimmed.endsWith('"'))
		|| (trimmed.startsWith("'") && trimmed.endsWith("'"))
	) ? trimmed.slice(1, -1) : trimmed;

	return unquoted.replace(/\\(["'])/g, '$1').replace(/\s+/g, ' ').trim();
};

const shouldImportFontFamily = (fontFamily: string): boolean => {
	const normalized = fontFamily.toLowerCase();
	return Boolean(fontFamily)
		&& !GENERIC_FONT_FAMILIES.has(normalized)
		&& !normalized.startsWith('var(')
		&& !normalized.startsWith('local(');
};

export const extractFontFamiliesFromStack = (fontStack: string): string[] => {
	return splitFontStack(fontStack)
		.map(normalizeFontFamily)
		.filter(shouldImportFontFamily);
};

export const buildGoogleFontHref = (fontFamily: string): string => {
	const encodedFamily = encodeURIComponent(fontFamily).replace(/%20/g, '+');
	return `https://fonts.googleapis.com/css2?family=${encodedFamily}${GOOGLE_FONT_VARIANTS}&display=swap`;
};

export const collectFontFamilies = (fontStacks: Array<string | undefined>): string[] => {
	const fontFamilies = new Map<string, string>();

	fontStacks.forEach((fontStack) => {
		// Only the first importable font in each stack is needed; the rest are fallbacks.
		const [firstFontFamily] = extractFontFamiliesFromStack(fontStack || '');
		if (firstFontFamily) {
			const key = firstFontFamily.toLowerCase();
			if (!fontFamilies.has(key)) {
				fontFamilies.set(key, firstFontFamily);
			}
		}
	});

	return Array.from(fontFamilies.values()).sort((left, right) => left.localeCompare(right));
};

const clampFontSizeMultiplier = (multiplier: number): number => {
	return Math.max(MIN_FONT_SIZE_MULTIPLIER, Math.min(MAX_FONT_SIZE_MULTIPLIER, multiplier));
};

const getFontCacheKey = (fontStack: string): string => normalizeFontFamily(fontStack).toLowerCase();

const measureFontXHeightRatio = (fontStack: string): number | null => {
	if (typeof document === 'undefined') {
		return null;
	}

	const measurementFont = `400 ${FONT_MEASUREMENT_SIZE_PX}px ${fontStack}`;
	if (document.fonts && !document.fonts.check(measurementFont)) {
		return null;
	}

	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	if (!context) {
		return null;
	}

	context.font = measurementFont;
	const metrics = context.measureText('x');
	const xHeight = (metrics.actualBoundingBoxAscent ?? 0) + (metrics.actualBoundingBoxDescent ?? 0);

	return xHeight > 0 ? xHeight / FONT_MEASUREMENT_SIZE_PX : null;
};

export const clearFontSizeMultiplierCache = (): void => {
	fontSizeMultiplierCache.clear();
};

const cacheFontSizeMultiplier = (fontStack: string): number => {
	const cacheKey = getFontCacheKey(fontStack);
	const cachedMultiplier = fontSizeMultiplierCache.get(cacheKey);
	if (cachedMultiplier !== undefined) {
		return cachedMultiplier;
	}

	const xHeightRatio = measureFontXHeightRatio(fontStack);
	const multiplier = xHeightRatio
		? clampFontSizeMultiplier(TARGET_X_HEIGHT_RATIO / xHeightRatio)
		: 1;

	fontSizeMultiplierCache.set(cacheKey, multiplier);
	return multiplier;
};

const preloadFontSizeMultipliers = async (fontFamilies: string[]): Promise<void> => {
	if (typeof document === 'undefined') {
		return;
	}

	if (document.fonts) {
		await Promise.allSettled(
			fontFamilies.map(fontFamily => document.fonts.load(`400 ${FONT_MEASUREMENT_SIZE_PX}px ${fontFamily}`))
		);
		await document.fonts.ready;
	}

	fontFamilies.forEach(cacheFontSizeMultiplier);
};

export const getFontSizeMultiplier = (fontStack?: string): number => {
	const trimmedFontStack = fontStack?.trim();
	if (!trimmedFontStack) {
		return 1;
	}

	return cacheFontSizeMultiplier(trimmedFontStack);
};

export const buildGoogleFontLinkTags = (fontStacks: Array<string | undefined>): string => {
	const fontFamilies = collectFontFamilies(fontStacks);
	if (fontFamilies.length === 0) {
		return '';
	}

	const preconnectTags = '<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />';
	const stylesheetTags = fontFamilies
		.map(fontFamily => `<link rel="stylesheet" href="${buildGoogleFontHref(fontFamily)}" />`)
		.join('');

	return `${preconnectTags}${stylesheetTags}`;
};

export const buildGoogleFontImportRules = (fontStacks: Array<string | undefined>): string => {
	const fontFamilies = collectFontFamilies(fontStacks);
	if (fontFamilies.length === 0) {
		return '';
	}

	return fontFamilies
		.map(fontFamily => `@import url("${buildGoogleFontHref(fontFamily)}");`)
		.join(' ');
};



const ensureGoogleFontPreconnects = () => {
	const existingPreconnects = document.head.querySelectorAll(`link[${GOOGLE_FONT_PRECONNECT_ATTRIBUTE}]`);
	if (existingPreconnects.length > 0) {
		return;
	}

	[
		{ href: 'https://fonts.googleapis.com' },
		{ href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
	].forEach(({ href, crossOrigin }) => {
		const link = document.createElement('link');
		link.rel = 'preconnect';
		link.href = href;
		link.setAttribute(GOOGLE_FONT_PRECONNECT_ATTRIBUTE, 'true');
		if (crossOrigin) {
			link.crossOrigin = crossOrigin;
		}
		document.head.appendChild(link);
	});
};

const syncGoogleFontLinks = (fontFamilies: string[]) => {
	ensureGoogleFontPreconnects();

	const nextFontKeys = new Set(fontFamilies.map(fontFamily => fontFamily.toLowerCase()));
	document.head.querySelectorAll<HTMLLinkElement>(`link[${GOOGLE_FONT_LINK_ATTRIBUTE}]`).forEach((link) => {
		const fontKey = link.getAttribute(GOOGLE_FONT_LINK_ATTRIBUTE) || '';
		if (!nextFontKeys.has(fontKey)) {
			link.remove();
		}
	});

	fontFamilies.forEach((fontFamily) => {
		const fontKey = fontFamily.toLowerCase();
		const existingLink = document.head.querySelector<HTMLLinkElement>(`link[${GOOGLE_FONT_LINK_ATTRIBUTE}="${CSS.escape(fontKey)}"]`);
		if (existingLink) {
			return;
		}

		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = buildGoogleFontHref(fontFamily);
		link.setAttribute(GOOGLE_FONT_LINK_ATTRIBUTE, fontKey);
		document.head.appendChild(link);
	});

};

const processFontFamilies = (fontFamilies: string[]): string[] => {
	const processedFontFamilies = new Map<string, string>();

	fontFamilies.forEach((fontFamily) => {
		const normalizedFontFamily = normalizeFontFamily(fontFamily);
		if (!shouldImportFontFamily(normalizedFontFamily)) {
			return;
		}

		const fontKey = normalizedFontFamily.toLowerCase();
		if (!processedFontFamilies.has(fontKey)) {
			processedFontFamilies.set(fontKey, normalizedFontFamily);
		}
	});

	return Array.from(processedFontFamilies.values()).sort((left, right) => left.localeCompare(right));
};

export const FontHandler: FC<FontHandlerProps> = ({ fontFamilies }) => {
	const [fontSignature, setFontSignature] = useState('');

	useEffect(() => {
		const refreshFontSignature = () => {
			setFontSignature(processFontFamilies(fontFamilies).join('\n'));
		};

		refreshFontSignature();
		const intervalId = window.setInterval(refreshFontSignature, FONT_REFRESH_INTERVAL_MS);

		return () => window.clearInterval(intervalId);
	}, [fontFamilies]);

	useEffect(() => {
		const processedFontFamilies = fontSignature ? fontSignature.split('\n') : [];
		syncGoogleFontLinks(processedFontFamilies);
		clearFontSizeMultiplierCache();
		preloadFontSizeMultipliers(processedFontFamilies).catch(() => undefined);
	}, [fontSignature]);

	useEffect(() => {
		return () => {
			document.head.querySelectorAll(`link[${GOOGLE_FONT_LINK_ATTRIBUTE}]`).forEach(link => link.remove());
			document.head.querySelectorAll(`link[${GOOGLE_FONT_PRECONNECT_ATTRIBUTE}]`).forEach(link => link.remove());
		};
	}, []);

	return null;
};

export default FontHandler;