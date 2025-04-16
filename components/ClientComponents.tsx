'use client';

import StarsBackground from "@/components/StarsBackground";
import { Toaster } from "@/components/ui/sonner";
import ClientWrapper from '@/components/ClientWrapper';

export default function ClientComponents() {
  return (
    <>
      <StarsBackground />
      <Toaster duration={8000} position="bottom-left" />
      <ClientWrapper />
    </>
  );
} 