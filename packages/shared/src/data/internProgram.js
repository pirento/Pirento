// The Pirento Intern programme: the four lengths on offer (prices are set by a superadmin in admin, never here),
// how the final mark is made, and the grade each mark earns. The learning service and the website both read this.
export const PROGRAM_MONTHS = [3, 6, 9, 12];

/** Weights of the final mark, in percent; they add up to 100. */
export const PROGRAM_SCORE = {tasks: 40, work: 40, attendance: 10, lessons: 10};

/** The lowest final mark that earns the programme certificate. */
export const PROGRAM_PASS = 50;

/** Letter grade for a final mark. */
export const gradeFor = (percent) =>
  percent >= 90 ? 'A+' : percent >= 80 ? 'A' : percent >= 70 ? 'B' : percent >= 60 ? 'C' : percent >= 50 ? 'D' : 'F';

/** The final mark: each part is a percent (0–100), weighted by PROGRAM_SCORE. */
export const finalMark = (parts) =>
  Math.round(Object.entries(PROGRAM_SCORE).reduce((sum, [k, w]) => sum + (parts[k] ?? 0) * w, 0) / 100);
