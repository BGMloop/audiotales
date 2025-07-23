'use client';

import dynamic from 'next/dynamic';

const ServiceWorkerRegistration = dynamic(
  () => import('@/components/ServiceWorkerRegistration'),
  { ssr: false }
);

export default function ClientWrapper() {
  return <ServiceWorkerRegistration />;
} 