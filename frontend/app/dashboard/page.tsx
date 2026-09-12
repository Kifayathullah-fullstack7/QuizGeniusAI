import StudentHub from '@/components/student/StudentHub';

export const metadata = {
  title: 'Student Hub & Learning DNA | QuizGenius AI',
  description: 'Unified learning workspace with diagnostic telemetry, AI study guides, flashcards, and progress tracking.',
};

export default function DashboardPage() {
  return <StudentHub initialTab="overview" />;
}
