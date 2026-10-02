'use client';

import * as React from 'react';
import type { Brand } from '@/lib/brand';
import type { Legal } from '@/lib/legal';

const BrandContext = React.createContext<Brand | null>(null);
const LegalContext = React.createContext<Legal | null>(null);

/**
 * Set once in the root layout from the request's host (lib/brand-server.ts).
 * The legal facts arrive as a prop so only the current brand's details are
 * ever sent to the browser.
 */
export function BrandProvider({
  brand,
  legal,
  children,
}: {
  brand: Brand;
  legal: Legal;
  children: React.ReactNode;
}) {
  return (
    <BrandContext.Provider value={brand}>
      <LegalContext.Provider value={legal}>{children}</LegalContext.Provider>
    </BrandContext.Provider>
  );
}

export function useBrand(): Brand {
  const brand = React.useContext(BrandContext);
  if (!brand) throw new Error('useBrand() must be used inside BrandProvider');
  return brand;
}

/** The legal facts for the visitor's brand (lib/legal.ts). */
export function useLegal(): Legal {
  const legal = React.useContext(LegalContext);
  if (!legal) throw new Error('useLegal() must be used inside BrandProvider');
  return legal;
}

/** The product name as text — usable inside server-rendered JSX too. */
export function BrandName() {
  return <>{useBrand().name}</>;
}
