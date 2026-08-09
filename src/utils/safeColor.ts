import { alpha as muiAlpha, darken as muiDarken, lighten as muiLighten } from '@mui/material/styles';

const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));

const asPercent = (value: number): string => `${Math.round(value * 10000) / 100}%`;

export const safeAlpha = (color: string, value: number): string => {
    try {
        return muiAlpha(color, value);
    } catch {
        const clampedValue = clampUnit(value);
        return `color-mix(in srgb, ${color} ${asPercent(clampedValue)}, transparent)`;
    }
};

export const safeDarken = (color: string, coefficient: number): string => {
    try {
        return muiDarken(color, coefficient);
    } catch {
        const clampedCoefficient = clampUnit(coefficient);
        return `color-mix(in srgb, ${color} ${asPercent(1 - clampedCoefficient)}, black)`;
    }
};

export const safeLighten = (color: string, coefficient: number): string => {
    try {
        return muiLighten(color, coefficient);
    } catch {
        const clampedCoefficient = clampUnit(coefficient);
        return `color-mix(in srgb, ${color} ${asPercent(1 - clampedCoefficient)}, white)`;
    }
};

export const safeGetContrastText = (
    getContrastText: (background: string) => string,
    backgroundColor: string,
    fallbackColor: string
): string => {
    try {
        return getContrastText(backgroundColor);
    } catch {
        return fallbackColor;
    }
};
