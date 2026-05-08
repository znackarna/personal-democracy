import { MethodologyDocView } from '../../../views/MethodologyDocView';
import { getMethodologyDocs, listValidationReports } from '../../../lib/markdown';

interface Params {
  slug: string;
}

export async function generateStaticParams(): Promise<Params[]> {
  const docs = getMethodologyDocs('cs');
  const validations = await listValidationReports('cs');
  return [
    ...docs.map((d) => ({ slug: d.slug })),
    ...validations.map((v) => ({ slug: v.slug })),
  ];
}

export const dynamicParams = false;

export default async function MethodologyDocPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return <MethodologyDocView locale="cs" slug={slug} />;
}
