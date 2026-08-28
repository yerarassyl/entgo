export const allowedProfilePairs: Array<[string, string]> = [
  ["Математика", "Физика"],
  ["Математика", "Информатика"],
  ["Математика", "География"],
  ["Биология", "Химия"],
  ["Биология", "География"],
  ["Иностранный язык", "Всемирная история"],
  ["География", "Иностранный язык"],
  ["Всемирная история", "Основы права"],
  ["Всемирная история", "География"],
  ["Химия", "Физика"],
];

export function isValidProfilePair(subjects: string[]) {
  if (subjects.length !== 2) return false;
  const [first, second] = subjects;
  return allowedProfilePairs.some(
    ([a, b]) => (a === first && b === second) || (a === second && b === first),
  );
}

export function canPairWithSelected(subject: string, selectedSubjects: string[]) {
  if (!selectedSubjects.length || selectedSubjects.includes(subject)) return true;
  if (selectedSubjects.length >= 2) return false;
  return isValidProfilePair([selectedSubjects[0], subject]);
}
