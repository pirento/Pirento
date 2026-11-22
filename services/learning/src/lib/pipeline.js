// The internship pipeline: which way an application may move, and who moves it.
export const APPLICATION_STATUSES = [
  'new', // applied
  'shortlisted',
  'interview', // a time and a link are set
  'offered', // waiting on the applicant
  'accepted', // the internship is running: tasks are set and sent
  'completed', // finished; the internship certificate is issued
  'declined', // the team said no (or took back an offer)
  'turned_down', // the applicant said no to the offer
];

/** Moves the team (staff, or the company that posted the opening) may make. interview → interview reschedules. */
export const TEAM_MOVES = {
  new: ['shortlisted', 'declined'],
  shortlisted: ['interview', 'offered', 'declined'],
  interview: ['interview', 'offered', 'declined'],
  offered: ['declined'],
  accepted: ['completed'],
};

/** The applicant only answers an offer. */
export const APPLICANT_MOVES = {offered: ['accepted', 'turned_down']};

export const canMove = (moves, from, to) => Boolean(moves[from]?.includes(to));

/** An internship completes once it had work and every task was approved. */
export const tasksDone = (tasks) => tasks.length > 0 && tasks.every((t) => t.status === 'approved');
