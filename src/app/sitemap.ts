import { MetadataRoute } from 'next';
import { getPortfolios } from '@/lib/notion';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.SITE_URL || 'https://theopeningsign.vercel.app';
  
  // 메인 페이지들
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 포트폴리오 상세 페이지들
  try {
    const portfolios = await getPortfolios();
    const portfolioRoutes: MetadataRoute.Sitemap = portfolios.map((item) => ({
      url: `${baseUrl}/portfolio/${encodeURIComponent(item.id)}`,
      lastModified: item.completedAt ? new Date(item.completedAt) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
    
    return [...routes, ...portfolioRoutes];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return routes;
  }
}












