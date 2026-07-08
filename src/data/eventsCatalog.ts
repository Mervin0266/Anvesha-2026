import { FestEvent } from '../types';

export const EVENTS_CATALOG: FestEvent[] = [
  // SPORTS
  {
    id: 'sports_football_boys',
    name: 'Football (Boys)',
    category: 'SPORTS',
    type: 'TEAM',
    minTeamSize: 11,
    maxTeamSize: 16,
    registrationFee: 2500,
    description: 'Inter PU 11-a-side Football Championship. Knockout tournament adhering to FIFA guidelines.',
    rules: [
      'Maximum 2 teams per institution (Team A and Team B).',
      'Match duration: 25 mins half with 5 mins break.',
      'Team must carry proper sports kit and football studs.',
      'Referees decisions are final and binding.'
    ],
    eligibility: 'Open to registered 1st & 2nd Year PU Students only.'
  },
  {
    id: 'sports_football_girls',
    name: 'Football (Girls)',
    category: 'SPORTS',
    type: 'TEAM',
    minTeamSize: 11,
    maxTeamSize: 16,
    registrationFee: 2500,
    description: 'Inter PU 11-a-side Football Championship. Knockout tournament adhering to FIFA guidelines.',
    rules: [
      'Maximum 2 teams per institution (Team A and Team B).',
      'Match duration: 25 mins half with 5 mins break.',
      'Team must carry proper sports kit and football studs.',
      'Referees decisions are final and binding.'
    ],
    eligibility: 'Open to registered 1st & 2nd Year PU Students only.'
  },
  {
    id: 'sports_volleyball_boys',
    name: 'Volleyball (Boys)',
    category: 'SPORTS',
    type: 'TEAM',
    minTeamSize: 6,
    maxTeamSize: 12,
    registrationFee: 1800,
    description: 'Fast-paced high-energy Volleyball Tournament under standard VFI rules.',
    rules: [
      'Maximum 2 teams per institution.',
      'Best of 3 sets (25 points per set).',
      'Proper team jersey with numbers mandatory.'
    ],
    eligibility: 'Open to registered 1st & 2nd Year PU Students.'
  },
  {
    id: 'sports_volleyball_girls',
    name: 'Volleyball (Girls)',
    category: 'SPORTS',
    type: 'TEAM',
    minTeamSize: 6,
    maxTeamSize: 12,
    registrationFee: 1800,
    description: 'Fast-paced high-energy Volleyball Tournament under standard VFI rules.',
    rules: [
      'Maximum 2 teams per institution.',
      'Best of 3 sets (25 points per set).',
      'Proper team jersey with numbers mandatory.'
    ],
    eligibility: 'Open to registered 1st & 2nd Year PU Students.'
  },
  {
    id: 'sports_basketball_boys',
    name: 'Basketball (Boys)',
    category: 'SPORTS',
    type: 'TEAM',
    minTeamSize: 5,
    maxTeamSize: 12,
    registrationFee: 2000,
    description: 'Full court Basketball tournament testing speed, strategy, and teamwork.',
    rules: [
      'Maximum 2 teams per institution.',
      'Four quarters of 8 minutes stop-clock timing.',
      'FIBA regulations apply.'
    ],
    eligibility: 'Open to registered 1st & 2nd Year PU Students.'
  },
  {
    id: 'sports_basketball_girls',
    name: 'Basketball (Girls)',
    category: 'SPORTS',
    type: 'TEAM',
    minTeamSize: 5,
    maxTeamSize: 12,
    registrationFee: 2000,
    description: 'Full court Basketball tournament testing speed, strategy, and teamwork.',
    rules: [
      'Maximum 2 teams per institution.',
      'Four quarters of 8 minutes stop-clock timing.',
      'FIBA regulations apply.'
    ],
    eligibility: 'Open to registered 1st & 2nd Year PU Students.'
  },
  {
    id: 'sports_tug_of_war_boys',
    name: 'Tug of War (Boys)',
    category: 'SPORTS',
    type: 'TEAM',
    minTeamSize: 8,
    maxTeamSize: 10,
    registrationFee: 1500,
    description: 'Test of pure strength, coordination, and team endurance.',
    rules: [
      'Maximum 2 teams per institution.',
      'Weight limit per team: 650kg cumulative maximum.',
      'Best of 3 pulls per round.'
    ],
    eligibility: 'Open to registered 1st & 2nd Year PU Students.'
  },
  {
    id: 'sports_tug_of_war_girls',
    name: 'Tug of War (Girls)',
    category: 'SPORTS',
    type: 'TEAM',
    minTeamSize: 8,
    maxTeamSize: 10,
    registrationFee: 1500,
    description: 'Test of pure strength, coordination, and team endurance.',
    rules: [
      'Maximum 2 teams per institution.',
      'Weight limit per team: 650kg cumulative maximum.',
      'Best of 3 pulls per round.'
    ],
    eligibility: 'Open to registered 1st & 2nd Year PU Students.'
  },

  // CULTURAL
  {
    id: 'cultural_dance',
    name: 'Group Dance',
    category: 'CULTURAL',
    type: 'TEAM',
    minTeamSize: 6,
    maxTeamSize: 15,
    registrationFee: 2200,
    description: 'Vibrant stage dance showcase incorporating choreography, synchronization, and creative concepts.',
    rules: [
      'Maximum 2 teams per institution.',
      'Time limit: 8 minutes + 2 minutes setup time.',
      'Props allowed (no fire, liquids, or sharp items).'
    ],
    eligibility: 'Open to registered 1st & 2nd Year PU Students.'
  },
  {
    id: 'cultural_music',
    name: 'Group Music',
    category: 'CULTURAL',
    type: 'TEAM',
    minTeamSize: 4,
    maxTeamSize: 10,
    registrationFee: 2000,
    description: 'Live musical ensemble featuring vocals, instruments, and harmonic arrangements.',
    rules: [
      'Maximum 2 teams per institution.',
      'Time limit: 10 minutes including setup.',
      'No pre-recorded backing tracks permitted.'
    ],
    eligibility: 'Open to registered 1st & 2nd Year PU Students.'
  },
  {
    id: 'cultural_debate',
    name: 'Debate',
    category: 'CULTURAL',
    type: 'INDIVIDUAL',
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationFee: 500,
    description: 'Intellectual arena for sharp arguments, rebuttals, and eloquent speaking.',
    rules: [
      'Maximum 2 participants per institution.',
      'Topic provided 1 hour before the session.',
      '3 mins constructive speech + 1 min rebuttal.'
    ],
    eligibility: 'Open to registered 1st & 2nd Year PU Students.'
  },
  {
    id: 'cultural_open_mic',
    name: 'Open Mic',
    category: 'CULTURAL',
    type: 'INDIVIDUAL',
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationFee: 400,
    description: 'Solo performance stage for creative expression in spoken word or comedy.',
    rules: [
      'Maximum 2 participants per institution.',
      'Performance time: 5 minutes max.',
      'Content must be respectful and strictly non-offensive.'
    ],
    eligibility: 'Open to registered 1st & 2nd Year PU Students.'
  },
  {
    id: 'cultural_treasure_hunt',
    name: 'Treasure Hunt',
    category: 'CULTURAL',
    type: 'TEAM',
    minTeamSize: 4,
    maxTeamSize: 4,
    registrationFee: 1200,
    description: 'Campus-wide thrill race solving riddles, puzzles, and physical clues across Christ University campus.',
    rules: [
      'Maximum 2 teams per institution.',
      'Mobile phones restricted during active clue rounds.',
      'All 4 members must cross the finish line together.'
    ],
    eligibility: 'Open to registered 1st & 2nd Year PU Students.'
  }
];
