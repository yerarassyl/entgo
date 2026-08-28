-- CreateEnum
CREATE TYPE "QuestionKind" AS ENUM ('SINGLE', 'MULTI', 'MATCHING');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN "kind" "QuestionKind" NOT NULL DEFAULT 'SINGLE';

-- AlterTable
ALTER TABLE "QuestionOption" ADD COLUMN "matchKey" TEXT;

-- AlterTable
ALTER TABLE "AttemptAnswer" ADD COLUMN "selectedOptionIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
