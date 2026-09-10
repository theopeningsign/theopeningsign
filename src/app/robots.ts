import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.SITE_URL || 'https://theopeningsign.vercel.app';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/img/'],
        disallow: ['/api/'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/api/img/'],
        disallow: ['/api/'],
      },
      {
        userAgent: 'Yeti',
        allow: ['/', '/api/img/'],
        disallow: ['/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}












