'use client';

import dynamic from 'next/dynamic';

export const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });
export const Configurator = dynamic(() => import('./Configurator'), { ssr: false });
export const Backdrop = dynamic(() => import('./Backdrop'), { ssr: false });
export const WorkshopShirt = dynamic(() => import('./WorkshopShirt'), { ssr: false });
