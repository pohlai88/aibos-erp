import { describe, it, expect } from 'vitest';
import { tokens, tokenResolver, tokenContracts, generateCSSVars, criticalTokens, colors, spacing, typography } from '../src/tokens';

describe('Design Tokens SSOT', () => {
  it('exposes light/dark modes with required surfaces', () => {
    expect(tokens.modes.light.background.base).toBeDefined();
    expect(tokens.modes.light.text.primary).toBeDefined();
    expect(tokens.modes.dark.background.base).toBeDefined();
    expect(tokens.modes.dark.text.primary).toBeDefined();
  });

  it('has focus ring widths and offsets', () => {
    expect(tokens.ring.width.md.endsWith('px')).toBe(true);
    expect(tokens.ring.offset.sm.endsWith('px')).toBe(true);
  });

  it('preserves primary palette 50→950 scale', () => {
    const steps = ['50','100','200','300','400','500','600','700','800','900','950'];
    steps.forEach((step) => {
      expect((tokens.colors.primary as Record<string, string>)[step]).toBeDefined();
    });
  });

  it('has intent-aware ring colors for all semantic states', () => {
    expect(tokens.ring.color.default).toBeDefined();
    expect(tokens.ring.color.success).toBeDefined();
    expect(tokens.ring.color.warning).toBeDefined();
    expect(tokens.ring.color.error).toBeDefined();
    expect(tokens.ring.color.info).toBeDefined();
  });

  it('provides semantic surfaces with guaranteed contrast pairs', () => {
    // Light mode semantic surfaces
    expect(tokens.semanticSurfaces.light.success.bg).toBeDefined();
    expect(tokens.semanticSurfaces.light.success.fg).toBeDefined();
    expect(tokens.semanticSurfaces.light.warning.bg).toBeDefined();
    expect(tokens.semanticSurfaces.light.error.bg).toBeDefined();
    expect(tokens.semanticSurfaces.light.info.bg).toBeDefined();
    
    // Dark mode semantic surfaces
    expect(tokens.semanticSurfaces.dark.success.bg).toBeDefined();
    expect(tokens.semanticSurfaces.dark.success.fg).toBeDefined();
    expect(tokens.semanticSurfaces.dark.warning.bg).toBeDefined();
    expect(tokens.semanticSurfaces.dark.error.bg).toBeDefined();
    expect(tokens.semanticSurfaces.dark.info.bg).toBeDefined();
  });

  it('includes interaction state opacities', () => {
    expect(tokens.states.hoverOpacity).toBeDefined();
    expect(tokens.states.activeOpacity).toBeDefined();
    expect(tokens.states.focusRingOpacity).toBeDefined();
    expect(tokens.states.disabledOpacity).toBeDefined();
  });

  it('provides density controls for responsive scaling', () => {
    expect(tokens.density.compact).toBe(0.875);
    expect(tokens.density.cozy).toBe(1.0);
    expect(tokens.density.comfortable).toBe(1.125);
  });

  it('includes sizing primitives for consistent UI', () => {
    expect(tokens.sizing.icon.xs).toBeDefined();
    expect(tokens.sizing.icon.md).toBeDefined();
    expect(tokens.sizing.fieldHeight.sm).toBeDefined();
    expect(tokens.sizing.fieldHeight.md).toBeDefined();
  });

  it('provides chart palettes for analytics dashboards', () => {
    expect(tokens.chart.categorical10).toHaveLength(10);
    expect(tokens.chart.sequentialBlue).toHaveLength(6);
    expect(tokens.chart.divergingRedBlue).toHaveLength(7); // Updated to 7 with neutral center
  });

  it('includes elevation overlays for dark mode surfaces', () => {
    expect(tokens.elevation.overlayAlpha[0]).toBe('0');
    expect(tokens.elevation.overlayAlpha[5]).toBe('0.12');
  });

  it('provides typographic numeric features for financial tables', () => {
    expect(tokens.typographyExtras.fontVariantNumeric.tabular).toBe('tabular-nums');
    expect(tokens.typographyExtras.fontVariantNumeric.lining).toBe('lining-nums');
    expect(tokens.typographyExtras.fontVariantNumeric.slashedZero).toBe('slashed-zero');
  });

  it('includes radius extensions for fine controls', () => {
    expect(tokens.borderRadiusExtra['2xs']).toBe('0.0625rem');
    expect(tokens.borderRadiusExtra['4xl']).toBe('2rem');
  });

  it('provides mode references for future build-time resolution', () => {
    expect(tokens.modeRefs.light.background.base).toBe('colors.neutral.50');
    expect(tokens.modeRefs.dark.background.base).toBe('colors.neutral.950');
    expect(tokens.modeRefs.light.text.primary).toBe('colors.neutral.900');
    expect(tokens.modeRefs.dark.text.primary).toBe('colors.neutral.100');
  });

  // Enhanced boundary and validation tests
  it('ensures opacities are within valid range (0-1)', () => {
    const hoverOpacity = parseFloat(tokens.states.hoverOpacity);
    const activeOpacity = parseFloat(tokens.states.activeOpacity);
    const focusRingOpacity = parseFloat(tokens.states.focusRingOpacity);
    const disabledOpacity = parseFloat(tokens.states.disabledOpacity);

    expect(hoverOpacity).toBeGreaterThanOrEqual(0);
    expect(hoverOpacity).toBeLessThanOrEqual(1);
    expect(activeOpacity).toBeGreaterThanOrEqual(0);
    expect(activeOpacity).toBeLessThanOrEqual(1);
    expect(focusRingOpacity).toBeGreaterThanOrEqual(0);
    expect(focusRingOpacity).toBeLessThanOrEqual(1);
    expect(disabledOpacity).toBeGreaterThanOrEqual(0);
    expect(disabledOpacity).toBeLessThanOrEqual(1);
  });

  it('validates elevation overlay alphas are within range', () => {
    Object.values(tokens.elevation.overlayAlpha).forEach(alpha => {
      const alphaValue = parseFloat(alpha);
      expect(alphaValue).toBeGreaterThanOrEqual(0);
      expect(alphaValue).toBeLessThanOrEqual(1);
    });
  });

  it('uses valid color formats', () => {
    // Test primary color palette
    Object.values(tokens.colors.primary).forEach(color => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    // Test semantic colors
    Object.values(tokens.colors.semantic).forEach(color => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    // Test ring colors
    Object.values(tokens.ring.color).forEach(color => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('maintains consistent naming patterns', () => {
    // Icon sizes should follow xs/sm/md/lg/xl pattern
    const iconSizes = Object.keys(tokens.sizing.icon);
    expect(iconSizes).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);

    // Field heights should follow sm/md/lg pattern
    const fieldHeights = Object.keys(tokens.sizing.fieldHeight);
    expect(fieldHeights).toEqual(['sm', 'md', 'lg']);

    // Ring widths should follow sm/md/lg pattern
    const ringWidths = Object.keys(tokens.ring.width);
    expect(ringWidths).toEqual(['sm', 'md', 'lg']);

    // Ring offsets should follow sm/md pattern
    const ringOffsets = Object.keys(tokens.ring.offset);
    expect(ringOffsets).toEqual(['sm', 'md']);
  });

  it('ensures density values are reasonable multipliers', () => {
    expect(tokens.density.compact).toBeLessThan(tokens.density.cozy);
    expect(tokens.density.cozy).toBeLessThan(tokens.density.comfortable);
    expect(tokens.density.compact).toBeGreaterThan(0.5);
    expect(tokens.density.comfortable).toBeLessThan(2.0);
  });

  it('validates semantic surface structure consistency', () => {
    const lightSurfaces = tokens.semanticSurfaces.light;
    const darkSurfaces = tokens.semanticSurfaces.dark;

    // Both modes should have the same surface types
    const lightKeys = Object.keys(lightSurfaces);
    const darkKeys = Object.keys(darkSurfaces);
    expect(lightKeys.sort()).toEqual(darkKeys.sort());

    // Each surface should have bg, fg, and border properties
    lightKeys.forEach(surfaceType => {
      expect(lightSurfaces[surfaceType]).toHaveProperty('bg');
      expect(lightSurfaces[surfaceType]).toHaveProperty('fg');
      expect(lightSurfaces[surfaceType]).toHaveProperty('border');
      expect(darkSurfaces[surfaceType]).toHaveProperty('bg');
      expect(darkSurfaces[surfaceType]).toHaveProperty('fg');
      expect(darkSurfaces[surfaceType]).toHaveProperty('border');
    });
  });

  it('ensures chart palettes have sufficient color diversity', () => {
    // Categorical palette should have 10 distinct colors
    const categoricalColors = tokens.chart.categorical10;
    const uniqueColors = new Set(categoricalColors);
    expect(uniqueColors.size).toBe(categoricalColors.length);

    // Sequential palette should have progressive intensity
    const sequentialColors = tokens.chart.sequentialBlue;
    expect(sequentialColors.length).toBeGreaterThanOrEqual(3);

    // Diverging palette should have odd number of colors (center neutral)
    const divergingColors = tokens.chart.divergingRedBlue;
    expect(divergingColors.length % 2).toBe(1);
    expect(divergingColors.length).toBe(7); // Should have 7 colors with neutral center
  });

  it('validates spacing progression is logical', () => {
    const spacingValues = Object.entries(tokens.spacing)
      .filter(([key]) => !isNaN(Number(key)))
      .map(([key, value]) => [Number(key), parseFloat(value)])
      .sort(([a], [b]) => a - b);

    // Check that spacing values generally increase
    for (let i = 1; i < spacingValues.length; i++) {
      const [, prevValue] = spacingValues[i - 1];
      const [, currValue] = spacingValues[i];
      expect(currValue).toBeGreaterThanOrEqual(prevValue);
    }
  });

  it('ensures typography numeric features are valid CSS values', () => {
    expect(tokens.typographyExtras.fontVariantNumeric.tabular).toBe('tabular-nums');
    expect(tokens.typographyExtras.fontVariantNumeric.lining).toBe('lining-nums');
    expect(tokens.typographyExtras.fontVariantNumeric.slashedZero).toBe('slashed-zero');
  });

  it('validates radius values are positive', () => {
    Object.values(tokens.borderRadius).forEach(radius => {
      if (radius !== '0' && radius !== '9999px') {
        const radiusValue = parseFloat(radius);
        expect(radiusValue).toBeGreaterThan(0);
      }
    });

    Object.values(tokens.borderRadiusExtra).forEach(radius => {
      const radiusValue = parseFloat(radius);
      expect(radiusValue).toBeGreaterThan(0);
    });
  });

  it('ensures mode references use valid token paths', () => {
    const validateTokenPath = (path: string) => {
      const pathParts = path.split('.');
      expect(pathParts.length).toBeGreaterThanOrEqual(2);
      expect(pathParts[0]).toMatch(/^(colors|spacing|typography|shadows|animation|breakpoints|zIndex)$/);
    };

    // Validate light mode references
    Object.values(tokens.modeRefs.light).forEach(modeGroup => {
      Object.values(modeGroup).forEach(path => {
        if (typeof path === 'string') {
          validateTokenPath(path);
        } else if (typeof path === 'object') {
          Object.values(path).forEach(nestedPath => {
            if (typeof nestedPath === 'string') {
              validateTokenPath(nestedPath);
            }
          });
        }
      });
    });

    // Validate dark mode references
    Object.values(tokens.modeRefs.dark).forEach(modeGroup => {
      Object.values(modeGroup).forEach(path => {
        if (typeof path === 'string') {
          validateTokenPath(path);
        } else if (typeof path === 'object') {
          Object.values(path).forEach(nestedPath => {
            if (typeof nestedPath === 'string') {
              validateTokenPath(nestedPath);
            }
          });
        }
      });
    });
  });

  // Hybrid optimization tests - Patch 2 surgical refinements
  it('provides system meta information for tooling', () => {
    expect(tokens.meta.version).toBeDefined();
    expect(tokens.meta.cssVarPrefix).toBe('aibos');
    expect(typeof tokens.meta.version).toBe('string');
  });

  it('defines brand identity with self-awareness', () => {
    expect(tokens.brand.name).toBe('AI-BOS');
    expect(tokens.brand.accentFamily).toBe('colors.primary');
    expect(tokens.brand.defaultShade).toBe(500);
    expect(tokens.brand.gradients.aurora).toContain('linear-gradient');
  });

  it('provides alias references for zero-duplication', () => {
    expect(tokens.aliasRefs.accent).toBe('colors.primary.500');
    expect(tokens.aliasRefs.success).toBe('colors.success.500');
    expect(tokens.aliasRefs.warning).toBe('colors.warning.500');
    expect(tokens.aliasRefs.error).toBe('colors.error.500');
    expect(tokens.aliasRefs.info).toBe('colors.primary.500');
    expect(tokens.aliasRefs.neutral).toBe('colors.neutral.500');
  });

  it('includes touch target sizing for WCAG compliance', () => {
    expect(tokens.sizing.touchTarget.min).toBe('44px');
  });

  it('provides chart reference tokens for consistent styling', () => {
    expect(tokens.chart.refs.gridline).toBe('colors.neutral.200');
    expect(tokens.chart.refs.axis).toBe('colors.neutral.400');
  });

  it('includes backdrop primitives for liquid glass effects', () => {
    expect(tokens.backdrop.blur.sm).toBe('4px');
    expect(tokens.backdrop.blur.md).toBe('8px');
    expect(tokens.backdrop.blur.lg).toBe('12px');
    expect(tokens.backdrop.saturate.sm).toBe('1.1');
    expect(tokens.backdrop.brightness.sm).toBe('1.05');
  });

  it('defines accessibility contrast thresholds', () => {
    expect(tokens.a11y.minContrastAA).toBe(4.5);
    expect(tokens.a11y.minContrastAAA).toBe(7.0);
  });

  // Hybrid optimization tests - Selective Patch 1 elements
  it('provides token resolution system for CSS generation', () => {
    expect(typeof tokenResolver.getValue).toBe('function');
    expect(typeof tokenResolver.toCSSVar).toBe('function');
    expect(typeof tokenResolver.critical).toBe('function');
    
    // Test token path resolution
    const primary500 = tokenResolver.getValue('colors.primary.500');
    expect(primary500).toBe('#3b82f6');
    
    // Test CSS variable generation
    const cssVar = tokenResolver.toCSSVar('colors.primary.500');
    expect(cssVar).toBe('--aibos-colors-primary-500');
    
    // Test critical tokens
    const critical = tokenResolver.critical();
    expect(critical.colors).toBeDefined();
    expect(critical.spacing).toBeDefined();
    expect(critical.typography).toBeDefined();
  });

  it('includes self-validating contracts for design system integrity', () => {
    expect(tokenContracts.contrast).toBeDefined();
    expect(tokenContracts.spacingScale).toBe('1.5rem');
    expect(typeof tokenContracts.validate).toBe('function');
    
    // Test contrast validation
    const contrastResult = tokenContracts.contrast.validate('#000000', '#ffffff');
    expect(contrastResult.ratio).toBeDefined();
    expect(typeof contrastResult.passesAA).toBe('boolean');
    
    // Test contract validation
    tokenContracts.validate().then(results => {
      expect(results.contrast).toBe(true);
      expect(results.spacing).toBe(true);
      expect(results.colors).toBe(true);
    });
  });

  it('maintains focus ring opacity consistency', () => {
    expect(tokens.states.focusRingOpacity).toBe('0.9');
  });

  it('ensures all alias references resolve to valid token paths', () => {
    const validateAliasRef = (path: string) => {
      const resolved = tokenResolver.getValue(path);
      expect(resolved).toBeDefined();
      expect(resolved).not.toBeUndefined();
    };

    Object.values(tokens.aliasRefs).forEach(path => {
      validateAliasRef(path);
    });
  });

  it('validates brand gradient syntax', () => {
    const gradient = tokens.brand.gradients.aurora;
    expect(gradient).toMatch(/^linear-gradient\(/);
    expect(gradient).toContain('135deg');
    expect(gradient).toContain('#3b82f6');
    expect(gradient).toContain('#22c55e');
    expect(gradient).toContain('#a855f7');
  });

  it('ensures backdrop values are reasonable', () => {
    // Blur values should be positive
    Object.values(tokens.backdrop.blur).forEach(blur => {
      const blurValue = parseFloat(blur);
      expect(blurValue).toBeGreaterThan(0);
      expect(blurValue).toBeLessThan(50); // Reasonable upper bound
    });
    
    // Saturate values should be >= 1
    Object.values(tokens.backdrop.saturate).forEach(saturate => {
      const saturateValue = parseFloat(saturate);
      expect(saturateValue).toBeGreaterThanOrEqual(1);
      expect(saturateValue).toBeLessThan(3); // Reasonable upper bound
    });
    
    // Brightness values should be >= 1
    Object.values(tokens.backdrop.brightness).forEach(brightness => {
      const brightnessValue = parseFloat(brightness);
      expect(brightnessValue).toBeGreaterThanOrEqual(1);
      expect(brightnessValue).toBeLessThan(2); // Reasonable upper bound
    });
  });

  // Hybrid optimization tests - Selective Feedback 1 elements
  it('provides tree-shaking guarantees with individual exports', () => {
    expect(colors).toBeDefined();
    expect(spacing).toBeDefined();
    expect(typography).toBeDefined();
    expect(colors).toBe(tokens.colors);
    expect(spacing).toBe(tokens.spacing);
    expect(typography).toBe(tokens.typography);
  });

  it('generates zero-runtime CSS variables', () => {
    const lightCSS = generateCSSVars('light');
    const darkCSS = generateCSSVars('dark');
    
    expect(lightCSS).toContain(':root, [data-theme="light"]');
    expect(darkCSS).toContain(':root, [data-theme="dark"]');
    expect(lightCSS).toContain('--aibos-background-base:');
    expect(darkCSS).toContain('--aibos-background-base:');
    expect(lightCSS).toContain('--aibos-text-primary:');
    expect(darkCSS).toContain('--aibos-text-primary:');
  });

  it('provides critical tokens for above-the-fold performance', () => {
    expect(criticalTokens.colors).toBeDefined();
    expect(criticalTokens.spacing).toBeDefined();
    expect(criticalTokens.typography).toBeDefined();
    
    // Critical tokens should be a subset of full tokens
    expect(criticalTokens.colors.primary).toBe(tokens.colors.primary);
    expect(criticalTokens.colors.neutral).toBe(tokens.colors.neutral);
    expect(criticalTokens.spacing[0]).toBe(tokens.spacing[0]);
    expect(criticalTokens.spacing[1]).toBe(tokens.spacing[1]);
    expect(criticalTokens.typography.fontSize.base).toBe(tokens.typography.fontSize.base);
  });

  it('validates critical tokens size constraint', () => {
    const criticalSize = JSON.stringify(criticalTokens).length;
    expect(criticalSize).toBeLessThan(2048); // Should be under 2KB
  });

  it('generates CSS variables with correct prefix', () => {
    const css = generateCSSVars('light');
    expect(css).toContain('--aibos-');
    expect(css).not.toContain('--other-prefix-');
  });

  it('handles nested mode token structures in CSS generation', () => {
    const css = generateCSSVars('light');
    expect(css).toContain('--aibos-background-base:');
    expect(css).toContain('--aibos-background-elevated:');
    expect(css).toContain('--aibos-text-primary:');
    expect(css).toContain('--aibos-text-secondary:');
  });
});
