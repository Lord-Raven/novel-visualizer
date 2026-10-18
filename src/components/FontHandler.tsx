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
const TARGET_CAP_HEIGHT_RATIO = 0.72;
const X_CAP_HEIGHT_SIMILARITY_THRESHOLD = 0.05;
const MIN_FONT_SIZE_MULTIPLIER = 0.75;
const MAX_FONT_SIZE_MULTIPLIER = 1.5;

const fontSizeMultiplierCache = new Map<string, number>();
const pendingFontLoads = new Map<string, Promise<void>>();
const fontMeasurementListeners = new Set<() => void>();
const CSS_VARIABLE_FUNCTION_PATTERN = /var\(\s*(--[-_a-zA-Z0-9]+)\s*(?:,\s*([^)]*))?\)/g;
const CSS_VARIABLE_REFERENCE_PATTERN = /\bvar\(/i;

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

const resolveCssFontStack = (fontStack: string, depth = 0): string | null => {
	const trimmedFontStack = fontStack.trim();
	if (!trimmedFontStack) {
		return null;
	}

	if (!CSS_VARIABLE_REFERENCE_PATTERN.test(trimmedFontStack)) {
		return trimmedFontStack;
	}

	if (typeof document === 'undefined' || depth > 4) {
		return null;
	}

	const rootStyles = window.getComputedStyle(document.documentElement);
	const resolvedFontStack = trimmedFontStack.replace(
		CSS_VARIABLE_FUNCTION_PATTERN,
		(_match, propertyName: string, fallbackValue: string | undefined) => {
			const resolvedValue = rootStyles.getPropertyValue(propertyName).trim();
			if (resolvedValue) {
				return resolvedValue;
			}

			return fallbackValue?.trim() ?? '';
		}
	).trim();

	if (!resolvedFontStack || resolvedFontStack === trimmedFontStack) {
		return null;
	}

	return resolveCssFontStack(resolvedFontStack, depth + 1);
};

const shouldImportFontFamily = (fontFamily: string): boolean => {
	const normalized = fontFamily.toLowerCase();
	return Boolean(fontFamily)
		&& !GENERIC_FONT_FAMILIES.has(normalized)
		&& !normalized.startsWith('var(')
		&& !normalized.startsWith('local(');
};

export const extractFontFamiliesFromStack = (fontStack: string): string[] => {
	const resolvedFontStack = resolveCssFontStack(fontStack);
	if (!resolvedFontStack) {
		return [];
	}

	return splitFontStack(resolvedFontStack)
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

const loadMeasurementFont = (fontStack: string): Promise<void> => {
	const pendingLoad = pendingFontLoads.get(fontStack);
	if (pendingLoad) {
		return pendingLoad;
	}

	const measurementFont = `400 ${FONT_MEASUREMENT_SIZE_PX}px ${fontStack}`;
	const load = Promise.resolve().then(async () => {
		console.log('[FontHandler] Loading measurement font', { fontStack, measurementFont });
		const faces = await document.fonts.load(measurementFont, 'xX');
		console.log('[FontHandler] Measurement font load completed', {
			fontStack,
			matchedFaces: faces.map(face => ({ family: face.family, status: face.status })),
			ready: document.fonts.check(measurementFont, 'xX'),
		});
		clearFontSizeMultiplierCache();
		fontMeasurementListeners.forEach(listener => listener());
	}).catch(error => {
		console.warn('[FontHandler] Measurement font load failed', { fontStack, measurementFont, error });
	}).finally(() => {
		pendingFontLoads.delete(fontStack);
	});
	pendingFontLoads.set(fontStack, load);
	return load;
};

const measureFontSizeMultiplier = (fontStack: string): number | null => {
	if (typeof document === 'undefined') {
		return null;
	}

	const measurementFont = `400 ${FONT_MEASUREMENT_SIZE_PX}px ${fontStack}`;
	if (document.fonts) {
		try {
			if (!document.fonts.check(measurementFont, 'xX')) {
				console.log('[FontHandler] Measurement deferred: font is still loading', { fontStack, measurementFont });
				void loadMeasurementFont(fontStack);
				return null;
			}
		} catch (error) {
			console.warn('[FontHandler] Invalid measurement font', { fontStack, measurementFont, error });
			return null;
		}
	}

	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	if (!context) {
		console.warn('[FontHandler] Canvas measurement unavailable', { fontStack });
		return null;
	}

	context.font = '10px monospace';
	context.font = measurementFont;
	if (context.font === '10px monospace') {
		console.warn('[FontHandler] Canvas rejected measurement font', { fontStack, measurementFont });
		return null;
	}
	context.textBaseline = 'alphabetic';
	console.log('[FontHandler] Measuring font', {
		fontStack,
		requestedFont: measurementFont,
		canvasFont: context.font,
		fontLoadingStatus: document.fonts?.status ?? 'unavailable',
		measurementSizePx: FONT_MEASUREMENT_SIZE_PX,
	});

	const metrics = context.measureText('x');
	const xHeight = (metrics.actualBoundingBoxAscent ?? 0) + (metrics.actualBoundingBoxDescent ?? 0);
	const capMetrics = context.measureText('X');
	const capHeight = (capMetrics.actualBoundingBoxAscent ?? 0) + (capMetrics.actualBoundingBoxDescent ?? 0);
	const hasValidXHeight = Number.isFinite(xHeight) && xHeight > 0;
	const hasValidCapHeight = Number.isFinite(capHeight) && capHeight > 0;
	if (!hasValidXHeight && !hasValidCapHeight) {
		console.warn('[FontHandler] No usable glyph heights', { fontStack, xHeight, capHeight });
		return null;
	}

	const heightDifferenceRatio = hasValidXHeight && hasValidCapHeight
		? Math.abs(xHeight - capHeight) / capHeight
		: null;
	const useCapHeight = !hasValidXHeight
		|| (heightDifferenceRatio !== null && heightDifferenceRatio <= X_CAP_HEIGHT_SIMILARITY_THRESHOLD);
	const measuredHeight = useCapHeight ? capHeight : xHeight;
	const targetHeightRatio = useCapHeight ? TARGET_CAP_HEIGHT_RATIO : TARGET_X_HEIGHT_RATIO;
	const rawMultiplier = targetHeightRatio / (measuredHeight / FONT_MEASUREMENT_SIZE_PX);
	const multiplier = clampFontSizeMultiplier(rawMultiplier);

	console.log('[FontHandler] Font measurement result', {
		fontStack,
		xHeight,
		capHeight,
		heightDifferenceRatio,
		similarityThreshold: X_CAP_HEIGHT_SIMILARITY_THRESHOLD,
		selectedMetric: useCapHeight ? 'cap-height' : 'x-height',
		targetHeightRatio,
		rawMultiplier,
		multiplier,
		clamped: multiplier !== rawMultiplier,
	});

	return multiplier;
};

export const clearFontSizeMultiplierCache = (): void => {
	fontSizeMultiplierCache.clear();
};

export const useFontMeasurementRevision = (): number => {
	const [revision, setRevision] = useState(0);

	useEffect(() => {
		if (typeof document === 'undefined' || !document.fonts) {
			return;
		}

		let active = true;
		const refreshMeasurements = () => {
			if (!active) {
				return;
			}
			clearFontSizeMultiplierCache();
			setRevision(previous => previous + 1);
		};

		document.fonts.addEventListener('loadingdone', refreshMeasurements);
		fontMeasurementListeners.add(refreshMeasurements);
		document.fonts.ready.then(refreshMeasurements);

		return () => {
			active = false;
			document.fonts.removeEventListener('loadingdone', refreshMeasurements);
			fontMeasurementListeners.delete(refreshMeasurements);
		};
	}, []);

	return revision;
};

const cacheFontSizeMultiplier = (fontStack: string): number => {
	const cacheKey = getFontCacheKey(fontStack);
	const cachedMultiplier = fontSizeMultiplierCache.get(cacheKey);
	if (cachedMultiplier !== undefined) {
		return cachedMultiplier;
	}

	const measuredMultiplier = measureFontSizeMultiplier(fontStack);
	if (!measuredMultiplier) {
		return 1;
	}

	fontSizeMultiplierCache.set(cacheKey, measuredMultiplier);
	return measuredMultiplier;
};

const preloadFontSizeMultipliers = async (fontFamilies: string[]): Promise<void> => {
	if (typeof document === 'undefined') {
		return;
	}

	if (document.fonts) {
		await Promise.all(fontFamilies.map(fontFamily => loadMeasurementFont(JSON.stringify(fontFamily))));
		await document.fonts.ready;
	}

	fontFamilies.forEach(cacheFontSizeMultiplier);
};

export const getFontSizeMultiplier = (fontStack?: string): number => {
	const trimmedFontStack = fontStack?.trim();
	if (!trimmedFontStack) {
		return 1;
	}

	const resolvedFontStack = resolveCssFontStack(trimmedFontStack);
	return resolvedFontStack ? cacheFontSizeMultiplier(resolvedFontStack) : 1;
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
	const stylesheetLoads: Promise<void>[] = [];

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
		if (existingLink?.sheet) {
			return;
		}

		const link = existingLink || document.createElement('link');
		stylesheetLoads.push(new Promise<void>((resolve) => {
			const cleanup = () => {
				link.removeEventListener('load', onLoad);
				link.removeEventListener('error', onError);
			};
			const onLoad = () => {
				cleanup();
				console.log('[FontHandler] Font stylesheet loaded', { fontFamily, href: link.href });
				resolve();
			};
			const onError = () => {
				cleanup();
				console.warn('[FontHandler] Font stylesheet failed to load', { fontFamily, href: link.href });
				resolve();
			};
			link.addEventListener('load', onLoad);
			link.addEventListener('error', onError);
		}));
		if (existingLink) {
			return;
		}

		link.rel = 'stylesheet';
		link.href = buildGoogleFontHref(fontFamily);
		link.setAttribute(GOOGLE_FONT_LINK_ATTRIBUTE, fontKey);
		document.head.appendChild(link);
	});

	return Promise.all(stylesheetLoads);
};

const processFontFamilies = (fontFamilies: string[]): string[] => {
	const processedFontFamilies = new Map<string, string>();

	fontFamilies.forEach((fontFamily) => {
		const extractedFontFamilies = extractFontFamiliesFromStack(fontFamily);
		if (extractedFontFamilies.length === 0) {
			return;
		}

		extractedFontFamilies.forEach((normalizedFontFamily) => {
			const fontKey = normalizedFontFamily.toLowerCase();
			if (!processedFontFamilies.has(fontKey)) {
				processedFontFamilies.set(fontKey, normalizedFontFamily);
			}
		});
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
		let active = true;
		clearFontSizeMultiplierCache();
		syncGoogleFontLinks(processedFontFamilies).then(() => {
			if (active) {
				return preloadFontSizeMultipliers(processedFontFamilies);
			}
		}).catch(error => {
			console.warn('[FontHandler] Font preloading failed', { fontFamilies: processedFontFamilies, error });
		});
		return () => {
			active = false;
		};
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