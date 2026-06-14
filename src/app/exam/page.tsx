import { ExamClient } from "@/components/exam-client";
import { requirePaidUser } from "@/lib/paid-access";

export default async function ExamPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  await requirePaidUser();

  const { topic } = await searchParams;
  return <ExamClient topicId={topic} />;
}
