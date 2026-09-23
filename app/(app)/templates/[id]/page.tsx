import { redirect } from 'next/navigation';

// Editing happens inline on the list; this keeps deep links working.
export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/templates?edit=${id}`);
}
