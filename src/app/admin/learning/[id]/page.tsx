import LearningCourseClient from "./LearningCourseClient";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LearningCourseClient courseId={id} />;
}
