export type Method = 'guided-coding' | 'guided-learning';
export type TimelineVariant = 'manual' | 'plan-and-review';

interface Step {
  /** A skill you invoke, or something you do yourself. */
  kind: 'skill' | 'manual';
  title: string;
  description: string;
}

/** Steps `from` to `to` (zero-based, inclusive) that belong together. */
export interface Span {
  from: number;
  to: number;
  label: [string, string];
  /** Read by screen readers instead of the bracket. */
  description: string;
}

export interface Phase {
  kind: 'setup' | 'planning' | 'implementing' | 'guiding' | 'done';
  number?: number;
  title: string;
  note?: string;
  steps: Step[];
  /** Steps of which you pick exactly one, marked by a bracket. */
  choice?: Span;
  /** Steps that repeat, marked by an arrow back to the first of them. */
  loop?: Span;
}

const setup: Phase = {
  kind: 'setup',
  title: 'Once per repository',
  steps: [
    {
      kind: 'skill',
      title: 'guided-coding-setup',
      description: 'Writes AGENTS.md and ai-plans/, records feedback loops.',
    },
  ],
};

const done: Phase = {
  kind: 'done',
  title: 'Done',
  steps: [
    {
      kind: 'manual',
      title: 'Review the record and open the PR',
      description: 'Commit and publish with a normal prompt after approval.',
    },
  ],
};

const stabilizes = (from: number, to: number): Span => ({
  from,
  to,
  label: ['repeat until', 'it stabilizes'],
  description: `Steps ${from + 1} to ${to + 1} repeat until the plan stabilizes.`,
});

const guidedCodingPlanning: Record<TimelineVariant, Phase> = {
  manual: {
    kind: 'planning',
    number: 1,
    title: 'Planning Phase',
    loop: stabilizes(2, 4),
    steps: [
      {kind: 'manual', title: 'Discuss the approach', description: '"As an expert architect, how would you tackle this?"'},
      {kind: 'skill', title: 'guided-coding-write-plan', description: 'Writes the draft. Invoked once per plan.'},
      {kind: 'manual', title: 'Further discussion', description: 'Question the draft; revise it with plain prompts.'},
      {kind: 'skill', title: 'guided-coding-review-plan', description: 'Optional second opinion, in a fresh conversation.'},
      {kind: 'manual', title: 'Further discussion', description: '"Would you change anything about the plan?"'},
      {kind: 'skill', title: 'guided-coding-freeze-plan', description: 'Create any ticket first. Timestamps and freezes the plan; commit it afterwards.'},
    ],
  },
  'plan-and-review': {
    kind: 'planning',
    number: 1,
    title: 'Planning Phase',
    loop: stabilizes(2, 3),
    steps: [
      {kind: 'manual', title: 'Discuss the approach', description: '"As an expert architect, how would you tackle this?"'},
      {kind: 'skill', title: 'guided-coding-plan-and-review', description: 'In the same conversation: writes the draft; fresh reviewers refine it in rounds.'},
      {kind: 'manual', title: 'Read the report and the plan', description: 'Confirm the decision and scope changes it lists.'},
      {kind: 'manual', title: 'Further discussion', description: '"Would you change anything about the plan?"'},
      {kind: 'skill', title: 'guided-coding-freeze-plan', description: 'Create any ticket first. Timestamps and freezes the plan; commit it afterwards.'},
    ],
  },
};

const guidedLearningPlanning: Record<TimelineVariant, Phase> = {
  manual: {
    kind: 'planning',
    number: 1,
    title: 'Planning Phase',
    note: 'with a senior developer',
    loop: stabilizes(2, 4),
    steps: [
      {kind: 'manual', title: 'Discuss the approach', description: 'Your senior helps you judge the direction.'},
      {kind: 'skill', title: 'guided-coding-write-plan', description: 'Writes the draft. Invoked once per plan.'},
      {kind: 'manual', title: 'Further discussion', description: 'Your senior checks that the plan is laid out well.'},
      {kind: 'skill', title: 'guided-coding-review-plan', description: 'Optional second opinion, in a fresh conversation.'},
      {kind: 'manual', title: 'Further discussion', description: '"Would you change anything about the plan?"'},
      {kind: 'skill', title: 'guided-coding-freeze-plan', description: 'Timestamps and freezes the plan. Commit it afterwards.'},
    ],
  },
  'plan-and-review': {
    kind: 'planning',
    number: 1,
    title: 'Planning Phase',
    note: 'with a senior developer',
    loop: stabilizes(2, 3),
    steps: [
      {kind: 'manual', title: 'Discuss the approach', description: 'Your senior helps you judge the direction.'},
      {kind: 'skill', title: 'guided-coding-plan-and-review', description: 'In the same conversation: writes the draft; fresh reviewers refine it in rounds.'},
      {kind: 'manual', title: 'Read the report and the plan', description: 'Your senior checks the reviewed plan and its report.'},
      {kind: 'manual', title: 'Further discussion', description: '"Would you change anything about the plan?"'},
      {kind: 'skill', title: 'guided-coding-freeze-plan', description: 'Timestamps and freezes the plan. Commit it afterwards.'},
    ],
  },
};

const later: Record<Method, Phase[]> = {
  'guided-coding': [
    {
      kind: 'implementing',
      number: 2,
      title: 'Implementing Phase',
      steps: [
        {kind: 'skill', title: 'guided-coding-implement', description: 'With the frozen plan, in a fresh conversation. Plan and feedback loops steer it.'},
      ],
    },
    {
      kind: 'guiding',
      number: 3,
      title: 'Guiding Phase',
      steps: [
        {kind: 'manual', title: 'Review every changed file', description: 'Read it yourself; optionally add an agent review.'},
        {kind: 'manual', title: 'Iterate', description: 'Small issue: to Implementing. Large: to Planning.'},
        {kind: 'skill', title: 'guided-coding-write-deviations', description: 'Always for follow-ups; otherwise for material departures.'},
      ],
    },
  ],
  'guided-learning': [
    {
      kind: 'implementing',
      number: 2,
      title: 'Implementing Phase',
      note: 'you write the code',
      choice: {
        from: 1,
        to: 2,
        label: ['pick the one', 'for your stage'],
        description: 'Pick one of steps 2 and 3, the one for your stage.',
      },
      loop: {
        from: 3,
        to: 4,
        label: ['repeat per', 'milestone'],
        description: 'Steps 4 and 5 repeat for every milestone.',
      },
      steps: [
        {kind: 'manual', title: 'Start a fresh conversation', description: 'Invoke the skill that matches your stage.'},
        {kind: 'skill', title: 'guided-coding-implement-show-me', description: 'Beginning: complete code, one fragment at a time.'},
        {kind: 'skill', title: 'guided-coding-implement-coach-me', description: 'Advancing: you solve milestones, hints on demand.'},
        {kind: 'manual', title: 'Work through a milestone', description: 'Type the code, run the feedback loops, ask away.'},
        {kind: 'manual', title: 'Tick its criteria and commit', description: 'The agent updates your learning profile.'},
      ],
    },
    {
      kind: 'guiding',
      number: 3,
      title: 'Guiding Phase',
      note: 'with a senior developer',
      steps: [
        {kind: 'manual', title: 'Review every changed file together', description: 'Your senior verifies the result, with a human touch.'},
        {kind: 'manual', title: 'Iterate', description: 'Small issue: to Implementing. Large: to Planning.'},
        {kind: 'skill', title: 'guided-coding-write-deviations', description: 'Always for follow-ups; otherwise for material departures.'},
      ],
    },
  ],
};

export function phasesFor(method: Method, variant: TimelineVariant): Phase[] {
  const planning = method === 'guided-coding' ? guidedCodingPlanning : guidedLearningPlanning;
  return [setup, planning[variant], ...later[method], done];
}

export const methodNames: Record<Method, string> = {
  'guided-coding': 'Guided Coding',
  'guided-learning': 'Guided Learning',
};
