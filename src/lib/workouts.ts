export type WorkoutCategory =
  | "home_bodyweight"
  | "gym_strength"
  | "pilates_core"
  | "running"
  | "mobility"
  | "low_energy";

export type WorkoutLevel = "beginner" | "intermediate" | "advanced";

export type WorkoutBlock = {
  name: string;
  detail: string;
};

export type Workout = {
  id: string;
  title: string;
  category: WorkoutCategory;
  level: WorkoutLevel;
  durationMinutes: number;
  summary: string;
  equipment: string[];
  warmup: WorkoutBlock[];
  main: WorkoutBlock[];
  cooldown: WorkoutBlock[];
  cues: string[];
  safetyNotes: string[];
};

export const WORKOUT_REGISTRY: Record<string, Workout> = {
  beginner_home_reset_20: {
    id: "beginner_home_reset_20",
    title: "Beginner Home Reset",
    category: "home_bodyweight",
    level: "beginner",
    durationMinutes: 20,
    summary: "Low-friction first session. No equipment. Builds a baseline of strength, control and breathing.",
    equipment: ["None — floor space only"],
    warmup: [
      { name: "Cat-cow", detail: "1 min · slow, breath-led" },
      { name: "Shoulder rolls + arm circles", detail: "1 min" },
      { name: "Bodyweight squats", detail: "1 min · controlled tempo" },
    ],
    main: [
      { name: "Bodyweight squats", detail: "3 × 10" },
      { name: "Incline push-ups (hands on couch / wall)", detail: "3 × 8" },
      { name: "Glute bridges", detail: "3 × 12" },
      { name: "Dead bug", detail: "3 × 8 per side" },
      { name: "Plank hold", detail: "3 × 20 sec" },
    ],
    cooldown: [
      { name: "Child's pose", detail: "1 min" },
      { name: "Box breathing 4-4-4-4", detail: "2 min" },
    ],
    cues: [
      "Nasal breathing throughout.",
      "Stop 1–2 reps before failure on every set.",
      "Quality of movement beats number of reps.",
    ],
    safetyNotes: [
      "Skip any movement that produces sharp pain.",
      "If form breaks down, end the set early.",
    ],
  },
  core_back_support_15: {
    id: "core_back_support_15",
    title: "Core & Back Support",
    category: "pilates_core",
    level: "beginner",
    durationMinutes: 15,
    summary: "Pilates-style core control without aggressive loading. Good for back support and posture.",
    equipment: ["Mat or carpet"],
    warmup: [
      { name: "Pelvic tilts", detail: "1 min" },
      { name: "Cat-cow", detail: "1 min" },
    ],
    main: [
      { name: "Dead bug", detail: "3 × 8 per side" },
      { name: "Bird dog", detail: "3 × 8 per side" },
      { name: "Glute bridge with hold", detail: "3 × 10 · 2 sec hold" },
      { name: "Side plank (from knees)", detail: "3 × 20 sec per side" },
      { name: "Hollow body hold", detail: "3 × 15 sec" },
    ],
    cooldown: [
      { name: "Supine spinal twist", detail: "1 min per side" },
      { name: "Diaphragmatic breathing", detail: "2 min" },
    ],
    cues: [
      "Ribs down, low back lightly pressed into the floor.",
      "Inhale to prepare, exhale on effort.",
      "Move slow. Control beats speed.",
    ],
    safetyNotes: [
      "Stop if you feel pinching in the lower back.",
      "Keep the neck long — do not crunch through the neck.",
    ],
  },
  full_body_gym_45: {
    id: "full_body_gym_45",
    title: "Full-Body Gym Standard",
    category: "gym_strength",
    level: "intermediate",
    durationMinutes: 45,
    summary: "Compound-led strength session. Controlled loading. Run 2–3× per week.",
    equipment: ["Barbell or dumbbells", "Bench", "Rack (optional)"],
    warmup: [
      { name: "5 min easy bike / row", detail: "Raise body temp" },
      { name: "Bodyweight squats + arm circles", detail: "2 × 10" },
      { name: "Ramp sets on first lift", detail: "2–3 light sets" },
    ],
    main: [
      { name: "Goblet or back squat", detail: "4 × 6–8" },
      { name: "DB bench press or push-up variation", detail: "3 × 8–10" },
      { name: "DB row or lat pulldown", detail: "3 × 8–10" },
      { name: "Romanian deadlift", detail: "3 × 8" },
      { name: "Plank", detail: "3 × 30 sec" },
    ],
    cooldown: [
      { name: "Walk", detail: "3 min" },
      { name: "Box breathing 4-4-4-4", detail: "2 min" },
    ],
    cues: [
      "Leave 2 reps in the tank on every working set.",
      "Add weight only when all reps look identical.",
      "Log every set — what is not measured does not improve.",
    ],
    safetyNotes: [
      "Warm up before working sets — no cold heavy lifts.",
      "Stop the set if form breaks down.",
    ],
  },
  full_body_intermediate_45: {
    id: "full_body_intermediate_45",
    title: "Intermediate Full-Body",
    category: "gym_strength",
    level: "intermediate",
    durationMinutes: 45,
    summary: "Progresses strength and conditioning with controlled volume. Run 3× per week.",
    equipment: ["Barbell", "Dumbbells", "Bench"],
    warmup: [
      { name: "5 min row or bike", detail: "Easy pace" },
      { name: "Dynamic mobility", detail: "2 min — hips, shoulders, T-spine" },
      { name: "Ramp sets", detail: "3 sets building to working weight" },
    ],
    main: [
      { name: "Back squat", detail: "4 × 5" },
      { name: "Bench press", detail: "4 × 5" },
      { name: "Barbell row", detail: "4 × 6" },
      { name: "Romanian deadlift", detail: "3 × 8" },
      { name: "Farmer's carry", detail: "3 × 30 sec" },
    ],
    cooldown: [
      { name: "Walk", detail: "5 min" },
      { name: "Nasal breathing down-regulation", detail: "2 min" },
    ],
    cues: [
      "Working sets at RPE 7–8.",
      "Progress load by ~2.5% per week when reps are clean.",
      "Track all sets and notes — review weekly.",
    ],
    safetyNotes: [
      "If sleep is under 6 hours, reduce top sets by 10%.",
      "Pain ≠ progress. Modify or skip painful movements.",
    ],
  },
  run_walk_foundation_25: {
    id: "run_walk_foundation_25",
    title: "Run-Walk Foundation",
    category: "running",
    level: "beginner",
    durationMinutes: 25,
    summary: "Builds running capacity without overloading joints. Run 2–3× per week.",
    equipment: ["Running shoes", "Outdoor route or treadmill"],
    warmup: [
      { name: "Brisk walk", detail: "5 min" },
      { name: "Leg swings + ankle circles", detail: "1 min" },
    ],
    main: [
      { name: "Run-walk intervals", detail: "8 rounds — 1 min easy run, 1 min walk" },
    ],
    cooldown: [
      { name: "Walk", detail: "3 min" },
      { name: "Standing quad + calf stretch", detail: "1 min per side" },
    ],
    cues: [
      "Easy pace = can hold a short conversation.",
      "Nasal breathing as much as possible.",
      "Land soft. Short, quick steps.",
    ],
    safetyNotes: [
      "Stop and walk if pace forces mouth breathing.",
      "If knees or shins flare up, reduce run interval to 30 sec.",
    ],
  },
  low_energy_minimum_15: {
    id: "low_energy_minimum_15",
    title: "Minimum Standard Session",
    category: "low_energy",
    level: "beginner",
    durationMinutes: 15,
    summary: "Keeps the standard on a low-energy day. Short, achievable, no overreach.",
    equipment: ["None"],
    warmup: [
      { name: "Walk", detail: "3 min easy" },
    ],
    main: [
      { name: "Bodyweight squats", detail: "2 × 10" },
      { name: "Incline push-ups", detail: "2 × 8" },
      { name: "Glute bridges", detail: "2 × 12" },
      { name: "Easy walk", detail: "3 min" },
    ],
    cooldown: [
      { name: "Box breathing 4-4-4-4", detail: "2 min" },
    ],
    cues: [
      "Job today is showing up, not pushing.",
      "Stay 3+ reps from failure.",
      "Finish slightly fresher than you started.",
    ],
    safetyNotes: [
      "If energy stays low after warm-up, stop at 10 minutes — the standard is met.",
    ],
  },
};

export function getWorkoutById(id: string): Workout | null {
  return WORKOUT_REGISTRY[id] ?? null;
}
