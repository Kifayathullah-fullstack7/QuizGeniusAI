import StudentHub from '@/components/student/StudentHub';

export const metadata = {
  title: 'AI Study Guide | QuizGenius AI',
  description: 'AI-generated comprehensive study guide, high-yield exam rules, and vocabulary.',
};

export default function StudyGuidePage() {
  return <StudentHub initialTab="study" />;
}
