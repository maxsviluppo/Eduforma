import CourseEditClient from "./CourseEditClient";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CourseEditClient courseId={id} />;
}
