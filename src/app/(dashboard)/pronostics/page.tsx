import { PredictionComposer } from "@/components/predictions/prediction-composer";
import { getCandidates2027 } from "@/features/candidates/repository";
import { getPredictionPageData2027 } from "@/features/predictions/repository";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const [candidates, prediction] = await Promise.all([getCandidates2027(), getPredictionPageData2027()]);
  return <PredictionComposer candidates={candidates} prediction={prediction} />;
}
