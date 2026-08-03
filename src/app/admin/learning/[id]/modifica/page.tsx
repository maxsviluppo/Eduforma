import AdminLearningEditClient from "./AdminLearningEditClient";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminLearningEditClient courseId={id} />;
}
