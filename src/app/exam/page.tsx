import { ExamClient } from "@/components/exam-client";
import { requirePaidUser } from "@/lib/paid-access";

export default async function ExamPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; testId?: string; errorReview?: string }>;
}) {
  await requirePaidUser();

  const { topic, testId, errorReview } = await searchParams;
  return (
    <ExamClient
      topicId={topic}
      testId={testId}
      errorReview={errorReview === "true" || errorReview === "1"}
    />
  );
}

