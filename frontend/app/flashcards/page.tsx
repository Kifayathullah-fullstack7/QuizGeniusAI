import StudentHub from '@/components/student/StudentHub';

export const metadata = {
  title: 'Flashcards & Spaced Repetition | QuizGenius AI',
  description: 'Interactive 3D flashcards with active recall testing and spaced repetition.',
};

export default function FlashcardsPage() {
  return <StudentHub initialTab="flashcards" />;
}
