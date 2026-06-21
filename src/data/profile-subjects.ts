import {
  Atom,
  Calculator,
  Dna,
  FlaskConical,
  Globe2,
  Landmark,
  Languages,
  Laptop,
  LucideIcon,
} from "lucide-react";
import { profileTopicCatalog, topicsForSubjects } from "@/data/profile-topic-catalog";

export type ProfileSubject = {
  value: string;
  icon: LucideIcon;
  topics: Array<{ name: string; growth: number; reason: string }>;
};

export const profileSubjects: ProfileSubject[] = [
  {
    value: "Математика",
    icon: Calculator,
    topics: profileTopicCatalog["Математика"],
  },
  {
    value: "Физика",
    icon: Atom,
    topics: profileTopicCatalog["Физика"],
  },
  {
    value: "Информатика",
    icon: Laptop,
    topics: profileTopicCatalog["Информатика"],
  },
  {
    value: "Химия",
    icon: FlaskConical,
    topics: profileTopicCatalog["Химия"],
  },
  {
    value: "Биология",
    icon: Dna,
    topics: profileTopicCatalog["Биология"],
  },
  {
    value: "География",
    icon: Globe2,
    topics: profileTopicCatalog["География"],
  },
  {
    value: "Всемирная история",
    icon: Landmark,
    topics: profileTopicCatalog["Всемирная история"],
  },
  {
    value: "Английский язык",
    icon: Languages,
    topics: profileTopicCatalog["Английский язык"],
  },
];

export { topicsForSubjects };
