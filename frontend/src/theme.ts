import { colorsTuple, createTheme } from '@mantine/core';

export const theme = createTheme({
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    headings: {
        fontWeight: '600',
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
            '#2d9e9a',
            '#128f8d',
            '#008080',
        ],
        present: colorsTuple('#00E3CF'),
        incomplete: colorsTuple('#FF9E51'),
        missing: colorsTuple('#FF776C'),
        error: colorsTuple('#FF776C'),
    },
    primaryColor: 'favras-teal',
    primaryShade: 9,
    defaultRadius: 'md',
});
