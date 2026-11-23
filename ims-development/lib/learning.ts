export const lessons = [
  {
    id: "photosynthesis",
    title: "Understanding Photosynthesis",
    subject: "Science",
    chapter: "Life Processes",
    art: 0,
    sections: [
      [
        "Energy from sunlight",
        "A tree cannot walk to a shop to buy food. Instead, its leaves use light energy to build sugars from water and carbon dioxide. This process is called photosynthesis.",
      ],
      [
        "Inside a leaf",
        "Chloroplasts contain chlorophyll, a green pigment that absorbs light. Roots take up water from the soil, and tiny pores in the leaves allow carbon dioxide to enter. Oxygen is released into the air.",
      ],
      [
        "Think it through",
        "A plant uses the sugars it makes for energy and growth. If two similar plants receive the same water but different amounts of light, how might their growth differ?",
      ],
    ],
  },
  {
    id: "linear-equations",
    title: "Introduction to Linear Equations",
    subject: "Mathematics",
    chapter: "Algebra",
    art: 1,
    sections: [
      [
        "A balanced statement",
        "An equation says that two expressions have the same value. A linear equation in one variable contains the variable only to the first power. Picture a balance scale: changing one side requires the same change on the other.",
      ],
      [
        "Finding an unknown",
        "Consider a number plus seven that equals twelve. Subtract seven from both sides to find that the number is five. Substitute five back into the original statement to check the answer.",
      ],
      [
        "Try it yourself",
        "Three identical notebooks and a two-dollar pen cost fourteen dollars. Subtract the cost of the pen, then divide the remainder by three. Each notebook costs four dollars.",
      ],
    ],
  },
  {
    id: "civilizations",
    title: "Early River Valley Civilizations",
    subject: "History",
    chapter: "The Ancient World",
    art: 2,
    sections: [
      [
        "Life beside a river",
        "Many early cities grew along rivers. Water supported crops, carried people and goods, and helped communities stay in one place throughout the year.",
      ],
      [
        "Farming and cooperation",
        "Farmers in Mesopotamia dug canals to move water to their fields. Maintaining these canals required shared rules and organized work. A food surplus allowed some people to become traders, builders or scribes.",
      ],
      [
        "Reading the evidence",
        "Archaeologists study pottery, buildings and written records to learn about past societies. A clay tablet listing grain deliveries suggests both agriculture and record keeping.",
      ],
    ],
  },
  {
    id: "respiration",
    title: "How Cells Release Energy",
    subject: "Science",
    chapter: "Life Processes",
    art: 0,
    sections: [
      [
        "Energy for life",
        "Even when you are sitting still, your cells need energy. Cellular respiration releases energy from sugars so cells can grow, repair themselves and do work.",
      ],
      [
        "Following the materials",
        "In aerobic respiration, cells use oxygen and glucose. The products include carbon dioxide and water. Plants respire both in daylight and at night.",
      ],
    ],
  },
  {
    id: "triangles",
    title: "The Angles of a Triangle",
    subject: "Mathematics",
    chapter: "Geometry",
    art: 1,
    sections: [
      [
        "Three sides, three angles",
        "On a flat plane, the three interior angles of a triangle always add up to 180 degrees. The lengths of the sides may differ, but the angle sum stays the same.",
      ],
      [
        "Find a missing angle",
        "If two angles are 50 degrees and 60 degrees, together they make 110 degrees. Subtract 110 from 180 to find the missing angle: 70 degrees.",
      ],
    ],
  },
  {
    id: "sources",
    title: "Working with Historical Sources",
    subject: "History",
    chapter: "The Ancient World",
    art: 2,
    sections: [
      [
        "Primary sources",
        "A primary source was created during the period being studied. A diary, a coin or an inscription can provide direct evidence about people and events.",
      ],
      [
        "Asking good questions",
        "Ask who made the source, why they made it and what else supports its account. Another perspective can reveal details that one source leaves out.",
      ],
    ],
  },
];
export type Lesson = (typeof lessons)[number];
export const fullText = (l: Lesson) =>
  [l.title, ...l.sections.map((s) => s.join("\n"))].join("\n\n");
export type Question = {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};
const q = (
  question: string,
  options: string[],
  correct: number,
  explanation: string,
): Question => ({ question, options, correct, explanation });
export const quizzes: Record<string, Question[]> = {
  "Life Processes": [
    q(
      "Which pigment absorbs light in a leaf?",
      ["Oxygen", "Chlorophyll", "Glucose", "Water"],
      1,
      "Chlorophyll in chloroplasts absorbs light energy.",
    ),
    q(
      "What gas enters leaves for photosynthesis?",
      ["Nitrogen", "Oxygen", "Carbon dioxide", "Hydrogen"],
      2,
      "Leaves take in carbon dioxide to make sugars.",
    ),
    q(
      "When do plants respire?",
      ["Only at night", "Only at noon", "Only in spring", "Day and night"],
      3,
      "Living plant cells need energy all the time.",
    ),
  ],
  Algebra: [
    q(
      "A number plus seven equals twelve. What is the number?",
      ["Five", "Seven", "Twelve", "Nineteen"],
      0,
      "Subtract seven from twelve to get five.",
    ),
    q(
      "How do you preserve equality?",
      [
        "Change one side",
        "Change both sides equally",
        "Remove the variable",
        "Ignore constants",
      ],
      1,
      "The same operation on both sides keeps the equation balanced.",
    ),
  ],
  Geometry: [
    q(
      "What is the angle sum of a plane triangle?",
      ["90 degrees", "360 degrees", "180 degrees", "270 degrees"],
      2,
      "The three interior angles total 180 degrees.",
    ),
    q(
      "Two angles are 50 and 60 degrees. Find the third.",
      ["50 degrees", "60 degrees", "80 degrees", "70 degrees"],
      3,
      "Subtract 110 from 180 to get 70 degrees.",
    ),
  ],
  "The Ancient World": [
    q(
      "Why did many early cities develop near rivers?",
      [
        "Less sunlight",
        "Water for crops and trade",
        "Fewer resources",
        "No need for farming",
      ],
      1,
      "Rivers provided water and routes for transport.",
    ),
    q(
      "Which is a primary source from an ancient city?",
      [
        "A modern film",
        "A textbook",
        "A contemporary clay tablet",
        "A recent novel",
      ],
      2,
      "A tablet made in the city at the time gives direct evidence.",
    ),
  ],
};
export type Day = { minutes: number; sessions: number; target: number };
export type Student = {
  name: string;
  grade: string;
  target: number;
  font: number;
  contrast: boolean;
  spacing: number;
  recent: string[];
  days: Record<string, Day>;
  results: { chapter: string; score: number; total: number; date: string }[];
  notes: { title: string; text: string }[];
};
export const initial: Student = {
  name: "",
  grade: "",
  target: 30,
  font: 100,
  spacing: 1.7,
  contrast: false,
  recent: [],
  days: {},
  results: [],
  notes: [],
};
export function dayKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function streak(s: Student) {
  let offset = 0,
    n = 0;
  const met = (k: string) => s.days[k] && s.days[k].minutes >= s.days[k].target;
  if (!met(dayKey())) offset--;
  while (met(dayKey(offset--))) n++;
  return n;
}
export const timeLabel = (n: number) =>
  n < 60 ? `${n} min` : `${Math.floor(n / 60)}h ${n % 60}m`;
export type Update = (fn: (s: Student) => Student) => void;
export async function requestTool(kind: string, body: object) {
  const r = await fetch("/api/study/" + kind, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    const message =
      (typeof data.error === "string" ? data.error : data.error?.message) ||
      data.message ||
      "The request could not be completed. Please try again.";
    throw Error(message);
  }
  if (r.headers.get("content-type")?.startsWith("audio/"))
    return { audioUrl: URL.createObjectURL(await r.blob()) };
  return r.json();
}
