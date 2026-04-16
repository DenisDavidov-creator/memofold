import { createTheme, rem } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'cyan',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, monospace',
  defaultRadius: 'md',

  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '700',
  },

  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Paper: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
      },
    },
    Input: {
      defaultProps: {
        radius: 'md',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
        overlayProps: { backgroundOpacity: 0.5, blur: 4 },
      },
    },
    Badge: {
      defaultProps: {
        radius: 'sm',
      },
    },
    ActionIcon: {
      defaultProps: {
        radius: 'md',
      },
    },
    Tabs: {
      styles: {
        tab: {
          fontWeight: '500',
        },
      },
    },
  },

  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.06)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
  },

  fontSizes: {
    xs: rem(13),
    sm: rem(15),
    md: rem(16),
    lg: rem(18),
    xl: rem(20),
  },

  spacing: {
    xs: rem(10),
    sm: rem(14),
    md: rem(18),
    lg: rem(26),
    xl: rem(36),
  },
});
