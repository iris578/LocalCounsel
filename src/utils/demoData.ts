import { db } from '../services/database';
import { indexMeeting } from '../services/embeddings';
import { initializeCactus, isReady } from '../services/cactus';
import { ExtractedInfo } from '../types';

interface DemoMeeting {
  matterId: string;
  transcript: string;
  extractedInfo: ExtractedInfo;
  durationSeconds: number;
  recordedAt: Date;
}

// Demo matters with realistic legal case names
const DEMO_MATTERS = [
  { name: 'Smith v. Acme Corporation' },
  { name: 'Johnson Estate Planning' },
  { name: 'Tech Startup IP Dispute' },
  { name: 'Martinez Employment Matter' },
];

// Demo meeting transcripts with extracted info
const DEMO_MEETINGS: Omit<DemoMeeting, 'matterId'>[] = [
  // Smith v. Acme Corporation meetings
  {
    transcript: `Client stated that the employment contract was signed on March 15th, 2024. She mentioned that Tom Richards, the HR Director, was present during the signing along with her direct supervisor Janet Williams.

The client explained that on September 1st, she received an email from Mr. Richards explicitly asking her to delete certain files related to the Johnson account. She claims she refused to comply with this request and still has the original email saved.

When asked about the timeline of events, the client seemed hesitant and had difficulty recalling specific dates between March and September. She mentioned the estimated damages are around fifty thousand dollars based on lost commissions and potential bonuses.

The client provided the names of two potential witnesses: Sarah Chen from the accounting department who can verify the commission calculations, and Mike Johnson, the former account manager who witnessed several key meetings.

Client indicated that Sarah might have copies of the original commission statements and email correspondence. We should subpoena these records from the company.`,
    extractedInfo: {
      keyFacts: [
        'Employment contract signed on March 15th, 2024',
        'Client received email on September 1st asking to delete files',
        'Client refused to delete files and retained original email',
        'Estimated damages approximately $50,000',
        'Sarah Chen has copies of commission statements',
      ],
      people: [
        { name: 'Tom Richards', role: 'HR Director' },
        { name: 'Janet Williams', role: 'Direct Supervisor' },
        { name: 'Sarah Chen', role: 'Accounting Department' },
        { name: 'Mike Johnson', role: 'Former Account Manager' },
      ],
      dates: [
        { date: 'March 15th, 2024', context: 'Contract signing date' },
        { date: 'September 1st', context: 'Email requesting file deletion' },
      ],
      actionItems: [
        'Obtain copy of the original employment contract',
        'Request email records from September 1st',
        'Interview Sarah Chen regarding commission calculations',
        'Subpoena commission statements from company',
        'Contact Mike Johnson as potential witness',
      ],
    },
    durationSeconds: 1847,
    recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    transcript: `Follow-up meeting regarding the Smith case. Client brought copies of the email correspondence with Tom Richards.

The emails clearly show a pattern of pressure to delete files related to the Johnson account. First email was sent on August 28th, marked "urgent" and requesting "cleanup of old project files." Second email on September 1st was more direct, specifically mentioning "the Johnson materials need to go."

Client also provided her performance reviews from the past three years, all of which were positive with ratings of "exceeds expectations." Her last bonus was $12,000 and she was expecting a promotion to Senior Account Manager.

The termination letter, dated September 15th, cites "performance issues" as the reason. This directly contradicts the performance review history.

Client mentioned that two weeks before termination, she had filed an internal complaint about expense report irregularities she noticed in the Johnson account. The complaint was filed with the ethics hotline on September 3rd.`,
    extractedInfo: {
      keyFacts: [
        'Email pattern shows pressure to delete files starting August 28th',
        'Performance reviews consistently "exceeds expectations"',
        'Last bonus was $12,000',
        'Termination letter contradicts performance history',
        'Internal ethics complaint filed September 3rd about expense irregularities',
      ],
      people: [
        { name: 'Tom Richards', role: 'Sender of deletion requests' },
      ],
      dates: [
        { date: 'August 28th', context: 'First email requesting file deletion' },
        { date: 'September 1st', context: 'Second, more direct deletion request' },
        { date: 'September 3rd', context: 'Ethics hotline complaint filed' },
        { date: 'September 15th', context: 'Termination date' },
      ],
      actionItems: [
        'Request copy of ethics hotline complaint',
        'Obtain all performance reviews from HR',
        'Document timeline of retaliation',
        'Calculate total damages including expected promotion',
      ],
    },
    durationSeconds: 1256,
    recordedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  // Johnson Estate Planning meetings
  {
    transcript: `Initial consultation with Robert Johnson regarding estate planning. Client is 72 years old, married to Margaret Johnson for 45 years. They have three adult children: David (48), Susan (45), and Michael (42).

Total estate value estimated at approximately 4.2 million dollars, consisting of primary residence valued at 1.1 million, vacation property in Florida worth 650,000, investment portfolio of 1.8 million, and retirement accounts totaling 650,000.

Client expressed concern about Michael's spending habits and potential substance abuse issues. He wants to ensure Michael's inheritance is protected, possibly through a spendthrift trust. David and Susan are both financially responsible with stable careers.

Client also mentioned his mother, Dorothy Johnson (94), is currently in assisted living and may require additional care. He is the primary decision-maker for her healthcare through an existing power of attorney.

Life insurance policy through Northwestern Mutual with death benefit of $500,000, beneficiary currently listed as spouse. Client wants to review whether to update beneficiaries to include children directly.`,
    extractedInfo: {
      keyFacts: [
        'Total estate value approximately $4.2 million',
        'Primary residence valued at $1.1 million',
        'Concern about one child (Michael) with spending issues',
        'Mother (94) in assisted living, client has POA',
        'Life insurance death benefit $500,000',
      ],
      people: [
        { name: 'Robert Johnson', role: 'Client, primary estate holder' },
        { name: 'Margaret Johnson', role: 'Spouse, married 45 years' },
        { name: 'David Johnson', role: 'Son, age 48' },
        { name: 'Susan Johnson', role: 'Daughter, age 45' },
        { name: 'Michael Johnson', role: 'Son, age 42, spending concerns' },
        { name: 'Dorothy Johnson', role: 'Mother, age 94, in assisted living' },
      ],
      dates: [],
      actionItems: [
        'Draft spendthrift trust provisions for Michael',
        'Review current will and trust documents',
        'Evaluate life insurance beneficiary options',
        'Discuss healthcare directive updates',
        'Schedule follow-up with Margaret present',
      ],
    },
    durationSeconds: 2134,
    recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  // Tech Startup IP Dispute
  {
    transcript: `Meeting with founders of NexGen AI regarding intellectual property dispute with former employer Quantum Systems.

Lead founder Alex Chen left Quantum Systems in January 2024 to start NexGen AI. Quantum is now claiming that NexGen's core algorithm infringes on their trade secrets. The algorithm in question relates to natural language processing and was allegedly developed while Alex was employed at Quantum.

Alex maintains that the NexGen algorithm is fundamentally different and was developed independently after leaving Quantum. He can provide documentation showing the algorithm was created from scratch using publicly available research papers and open-source foundations.

Key evidence: Alex's employment agreement with Quantum contains a non-compete clause limited to 12 months and does not include an invention assignment clause for work done outside company hours. Alex primarily worked on computer vision at Quantum, not NLP.

Co-founder Maria Santos joined NexGen in March 2024 and has no prior relationship with Quantum Systems. The NexGen codebase can be traced through Git commits starting February 2024.

Quantum's cease and desist letter arrived on October 15th, demanding NexGen halt all operations and turn over all code. They claim damages of 10 million dollars.`,
    extractedInfo: {
      keyFacts: [
        'Quantum claims NexGen algorithm infringes on trade secrets',
        'Alex worked on computer vision at Quantum, not NLP',
        'Non-compete limited to 12 months, no invention assignment for off-hours work',
        'NexGen codebase traceable via Git from February 2024',
        'Quantum demanding $10 million in damages',
      ],
      people: [
        { name: 'Alex Chen', role: 'Lead Founder, former Quantum employee' },
        { name: 'Maria Santos', role: 'Co-founder, no Quantum connection' },
      ],
      dates: [
        { date: 'January 2024', context: 'Alex left Quantum Systems' },
        { date: 'February 2024', context: 'First Git commits for NexGen codebase' },
        { date: 'March 2024', context: 'Maria Santos joined NexGen' },
        { date: 'October 15th', context: 'Cease and desist letter received' },
      ],
      actionItems: [
        'Obtain full employment agreement from Quantum',
        'Compile Git commit history with timestamps',
        'Document research paper sources for algorithm',
        'Identify expert witness for algorithm comparison',
        'Respond to cease and desist within deadline',
      ],
    },
    durationSeconds: 1678,
    recordedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  // Martinez Employment Matter
  {
    transcript: `Initial consultation with Elena Martinez regarding workplace discrimination claim. Client has been employed at Pacific Manufacturing for 8 years, currently holding position of Quality Control Supervisor.

Client alleges she was passed over for promotion to Quality Control Manager in favor of a less qualified male colleague, James Thompson. Client has been acting manager for 6 months during the previous manager's medical leave and received excellent feedback during this period.

Thompson was hired 2 years ago and has less experience in quality control. Client claims she trained Thompson when he first joined the company. Thompson's starting salary was also higher than Elena's current salary despite her seniority.

HR Director Patricia Gomez told Elena informally that "the position requires someone who can handle the stress" and that "some of the floor workers might not respond well to female leadership." Elena documented this conversation in an email to herself immediately after.

Elena has copies of her performance reviews, Thompson's publicly posted qualifications from his LinkedIn profile, and the internal job posting which lists requirements she meets but Thompson does not. She also has emails praising her work during the acting manager period.`,
    extractedInfo: {
      keyFacts: [
        'Client passed over for promotion despite 8 years experience',
        'Male colleague with 2 years experience promoted instead',
        'Client trained the promoted colleague',
        'HR Director made discriminatory comments about female leadership',
        'Thompson started at higher salary despite less seniority',
      ],
      people: [
        { name: 'Elena Martinez', role: 'Client, Quality Control Supervisor' },
        { name: 'James Thompson', role: 'Promoted colleague, 2 years experience' },
        { name: 'Patricia Gomez', role: 'HR Director, made discriminatory comments' },
      ],
      dates: [],
      actionItems: [
        'File EEOC complaint within deadline',
        'Preserve email documentation of HR comments',
        'Obtain salary comparison data through discovery',
        'Compare job posting requirements to Thompson\'s qualifications',
        'Identify other potential witnesses from floor workers',
      ],
    },
    durationSeconds: 1423,
    recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

export const loadDemoData = async (): Promise<void> => {
  console.log('Loading demo data...');

  // Ensure Cactus is initialized for embeddings
  if (!isReady()) {
    await initializeCactus('mock-model');
  }

  // Create matters
  const createdMatters: { id: string; name: string }[] = [];
  for (const matter of DEMO_MATTERS) {
    const created = await db.createMatter(matter.name);
    createdMatters.push({ id: created.id, name: created.name });
  }

  // Assign meetings to matters
  // First two meetings to Smith case
  // Third meeting to Johnson Estate
  // Fourth to Tech Startup
  // Fifth to Martinez
  const matterAssignments = [0, 0, 1, 2, 3];

  for (let i = 0; i < DEMO_MEETINGS.length; i++) {
    const meeting = DEMO_MEETINGS[i];
    const matterIndex = matterAssignments[i];
    const matter = createdMatters[matterIndex];

    const meetingId = `demo-${Date.now()}-${i}`;

    // Save meeting
    await db.saveMeeting({
      id: meetingId,
      matterId: matter.id,
      recordedAt: meeting.recordedAt,
      durationSeconds: meeting.durationSeconds,
      audioPath: undefined,
      transcript: meeting.transcript,
      extractedInfo: meeting.extractedInfo,
    });

    // Index for search
    await indexMeeting(meetingId, meeting.transcript);

    console.log(`Created meeting ${i + 1}/${DEMO_MEETINGS.length} for ${matter.name}`);
  }

  console.log('Demo data loaded successfully!');
};

export const clearDemoData = async (): Promise<void> => {
  await db.clear();
  console.log('Demo data cleared');
};
