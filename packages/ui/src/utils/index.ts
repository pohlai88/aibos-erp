import type {
  ComponentPropsWithRef,
  ElementType,
  MutableRefObject,
  Ref,
  RefCallback,
  ElementRef,
} from 'react';

import { clsx, type ClassValue } from 'clsx';
import { forwardRef, useCallback } from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Polymorphic component types
 * Allows components to render as different HTML elements via 'as' prop
 */
type AsProperty<As extends ElementType> = {
  as?: As;
};

type PropertiesToOmit<As extends ElementType, P> = keyof (As extends unknown
  ? ComponentPropsWithRef<As>
  : never) &
  keyof P;

export type PolymorphicProperties<As extends ElementType, P> = Omit<
  ComponentPropsWithRef<As>,
  PropertiesToOmit<As, P>
> &
  P &
  AsProperty<As>;

export type PolymorphicReference<As extends ElementType> = ComponentPropsWithRef<As>['ref'];

/**
 * Create a polymorphic component with correct ref forwarding.
 * Keeps your render(signature) but wraps with React.forwardRef to avoid "ref as prop".
 */
export function createPolymorphic<
  DefaultAs extends ElementType,
  OwnProperties = Record<string, unknown>,
>(
  render: (
    _props: PolymorphicProperties<DefaultAs, OwnProperties>,
    _ref: PolymorphicReference<DefaultAs>,
  ) => JSX.Element | null,
  displayName: string,
): <As extends ElementType = DefaultAs>(
  _props: PolymorphicProperties<As, OwnProperties> & {
    ref?: PolymorphicReference<As>;
  },
) => JSX.Element | null {
  // Wrap with forwardRef so consumers pass standard `ref` instead of a prop.
  const Comp = forwardRef<ElementRef<DefaultAs>, PolymorphicProperties<DefaultAs, OwnProperties>>(
    (_props, _ref) => {
      // We intentionally keep the render API you provided.
      return render(
        _props as PolymorphicProperties<DefaultAs, OwnProperties>,
        _ref as PolymorphicReference<DefaultAs>,
      );
    },
  );

  (Comp as { displayName?: string }).displayName = displayName;

  return Comp as <As extends ElementType = DefaultAs>(
    _props: PolymorphicProperties<As, OwnProperties> & {
      ref?: PolymorphicReference<As>;
    },
  ) => JSX.Element | null;
}

/**
 * Compose multiple refs into a single ref callback
 * Useful when you need to forward refs to multiple elements
 */
export function composeReferences<T>(...references: Array<Ref<T> | undefined>): RefCallback<T | null> {
  return (node: T | null) => {
    for (const ref of references) {
      if (!ref) continue;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        // React clears object refs with `null` on unmount.
        (ref as MutableRefObject<T | null>).current = node as T | null;
      }
    }
  };
}

/**
 * Hook variant that memoizes the composed ref callback.
 * Avoids unnecessary re-renders when passing to DOM nodes.
 */
export function useComposedRefs<T>(...references: Array<Ref<T> | undefined>): RefCallback<T | null> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(composeReferences<T>(...references), references);
}

/**
 * Create a variant system for component styling
 * Simple and focused variant management with type safety
 */
export function variants<
  V extends Record<string, Record<string, string>>,
  D extends Partial<{ [K in keyof V]: keyof V[K] }> = Partial<{
    [K in keyof V]: keyof V[K];
  }>,
>(config: { base: string; variants: V; defaultVariants?: D; strict?: boolean }) {
  type Props = Partial<{ [K in keyof V]: keyof V[K] }>;
  const { base, variants: variantConfig, defaultVariants, strict } = config;

  // Precompile to Maps to avoid dynamic object key sinks
  const variantMaps = new Map<string, Map<string, string>>(
    Object.entries(variantConfig).map(([k, v]) => [k, new Map(Object.entries(v))]),
  );

  return (props?: Props): string => {
    const resolvedProps = {
      ...(defaultVariants as object),
      ...(props as object),
    } as Props;
    let classes = base;

    // First apply defaults for all variant keys
    for (const [key, defaultValue] of Object.entries(defaultVariants || {})) {
      if (defaultValue) {
        const inner = variantMaps.get(key);
        const klass = inner?.get(String(defaultValue));
        if (klass) {
          classes = cn(classes, klass);
        }
      }
    }

    // Then override with provided props (only if they're valid)
    for (const [rawKey, rawValue] of Object.entries(props || {})) {
      if (rawValue === null || rawValue === undefined) continue;
      const key = String(rawKey);
      const value = String(rawValue);
      const inner = variantMaps.get(key);
      if (!inner) {
        if (strict && typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
          // eslint-disable-next-line no-console
          console.warn(`[variants] Unknown variant key "${key}"`);
        }
        continue;
      }
      const klass = inner.get(value);
      if (klass) {
        classes = cn(classes, klass);
      } else if (strict && typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
        // eslint-disable-next-line no-console
        console.warn(`[variants] Unknown value "${value}" for variant "${key}"`);
      }
    }
    return classes;
  };
}
