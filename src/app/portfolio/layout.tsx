"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { clearImageErrorFlags } from '@/lib/imageReload';

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	useEffect(() => {
		if (pathname?.startsWith('/portfolio')) {
			clearImageErrorFlags();
		}
	}, [pathname]);

	return <>{children}</>;
}





