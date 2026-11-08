import {
    Button,
    colorsTuple,
    createTheme,
    defaultVariantColorsResolver,
    type VariantColorsResolver,
} from '@mantine/core';

const variantColorResolver: VariantColorsResolver = (input) => {
    const defaultResolvedColors = defaultVariantColorsResolver(input);

    if (input.variant === 'filled') {
        return {
            ...defaultResolvedColors,
            hover: `light-dark(color-mix(in srgb, ${defaultResolvedColors.background} 82%, black), color-mix(in srgb, ${defaultResolvedColors.background} 80%, white))`,
        };
    }

    if (input.variant === 'light') {
        return {
            ...defaultResolvedColors,
            hover: `light-dark(color-mix(in srgb, ${defaultResolvedColors.background} 86%, black), color-mix(in srgb, ${defaultResolvedColors.background} 82%, white))`,
        };
    }

    if (input.variant === 'subtle') {
        return {
            ...defaultResolvedColors,
            hover: `light-dark(color-mix(in srgb, ${defaultResolvedColors.hover} 88%, black), color-mix(in srgb, ${defaultResolvedColors.hover} 82%, white))`,
        };
    }

    return defaultResolvedColors;
};

export const theme = createTheme({
    fontFamily:
        'Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    headings: {
        fontWeight: '600',
    },
    autoContrast: true,
    luminanceThreshold: 0.35,
    variantColorResolver,
    components: {
        Button: Button.extend({
            defaultProps: {
                variant: 'filled',
            },
        }),
    },
    colors: {
        'favras-teal': [
            '#ebffff',
            '#cef2f0',
            '#b2e5e1',
            '#96d7d2',
            '#7bcac4',
            '#61bcb6',
            '#47ada8',
            '#128f8d',
            '#008080',
            '#005f5f',
        ],
        present: colorsTuple('#00E3CF'),
        incomplete: colorsTuple('#FF9E51'),
        missing: colorsTuple('#FF776C'),
        error: colorsTuple('#FF776C'),
    },
    primaryColor: 'favras-teal',
    primaryShade: { light: 8, dark: 8 },
    defaultRadius: 'md',
});
