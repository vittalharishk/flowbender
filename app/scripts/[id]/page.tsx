import ScriptEditor from "@/components/scripts/script-editor";

export default async function ScriptDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ScriptEditor scriptId={params.id} />;
}
