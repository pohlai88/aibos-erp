import { describe, it, expect, vi } from 'vitest';
import { composeReferences, variants } from '../src/utils';

describe('composeReferences', () => {
  it('updates function and object refs and clears with null', () => {
    const fn = vi.fn<(node: HTMLDivElement | null) => void>();
    const obj = { current: null as HTMLDivElement | null };
    const cb = composeReferences<HTMLDivElement>(fn, obj);
    const node = {} as HTMLDivElement;
    
    cb(node);
    expect(fn).toHaveBeenCalledWith(node);
    expect(obj.current).toBe(node);
    
    cb(null);
    expect(fn).toHaveBeenCalledWith(null);
    expect(obj.current).toBeNull();
  });

  it('handles undefined refs gracefully', () => {
    const fn = vi.fn<(node: HTMLDivElement | null) => void>();
    const cb = composeReferences<HTMLDivElement>(fn, undefined);
    const node = {} as HTMLDivElement;
    
    cb(node);
    expect(fn).toHaveBeenCalledWith(node);
  });

  it('handles multiple refs correctly', () => {
    const fn1 = vi.fn<(node: HTMLDivElement | null) => void>();
    const fn2 = vi.fn<(node: HTMLDivElement | null) => void>();
    const obj = { current: null as HTMLDivElement | null };
    const cb = composeReferences<HTMLDivElement>(fn1, fn2, obj);
    const node = {} as HTMLDivElement;
    
    cb(node);
    expect(fn1).toHaveBeenCalledWith(node);
    expect(fn2).toHaveBeenCalledWith(node);
    expect(obj.current).toBe(node);
  });
});

describe('variants', () => {
  const button = variants({
    base: 'base',
    variants: {
      size: { sm: 'sm', md: 'md' },
      tone: { primary: 'p', secondary: 's' },
    },
    defaultVariants: { size: 'md' },
    strict: false, // Disable strict mode for tests to avoid window mocking
  });

  it('merges base and defaults and props', () => {
    const cls = button({ tone: 'primary' });
    expect(cls).toContain('base');
    expect(cls).toContain('md');
    expect(cls).toContain('p');
  });

  it('overrides defaults with props', () => {
    const cls = button({ size: 'sm', tone: 'secondary' });
    expect(cls).toContain('base');
    expect(cls).toContain('sm');
    expect(cls).toContain('s');
  });

  it('handles empty props', () => {
    const cls = button();
    expect(cls).toContain('base');
    expect(cls).toContain('md');
  });

  it('handles undefined props', () => {
    const cls = button(undefined);
    expect(cls).toContain('base');
    expect(cls).toContain('md');
  });

  it('handles unknown values gracefully', () => {
    const cls = button({ size: 'xl' as any });
    expect(cls).toContain('base');
    expect(cls).toContain('md'); // Should use default
  });

  it('handles unknown keys gracefully', () => {
    const cls = button({ unknownKey: 'value' as any });
    expect(cls).toContain('base');
    expect(cls).toContain('md'); // Should use default
  });

  it('handles falsy values correctly', () => {
    const cls = button({ size: null as any, tone: undefined as any });
    expect(cls).toContain('base');
    expect(cls).toContain('md'); // Should use default
  });
});
