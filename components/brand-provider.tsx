'use client';

import * as React from 'react';
import { BRANDS, type Brand } from '@/lib/brand';

const BrandContext = React.createContext<Brand>(BRANDS.repliva);

/** Set once in the root layout from the request's host (lib/brand-server.ts). */
export function BrandProvider({ brand, children }: { brand: Brand; children: React.ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): Brand {
  return React.useContext(BrandContext);
}

/** The product name as text — usable inside server-rendered JSX too. */
export function BrandName() {
  return <>{useBrand().name}</>;
}
