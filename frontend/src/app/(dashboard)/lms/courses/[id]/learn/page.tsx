"use client";

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Loader from '@/components/ui/Loader';

export default function CourseLearnRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const router = useRouter();

  useEffect(() => {
    if (courseId) {
      router.replace(`/learn/${courseId}`);
    }
  }, [courseId, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <Loader size="lg" text="Entering classroom..." />
    </div>
  );
}
