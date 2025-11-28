import { completion } from './cactus';
import { ExtractedInfo } from '../types';

const EXTRACTION_PROMPT = `You are a legal assistant analyzing a meeting transcript.

Extract the following information in JSON format:
{
  "keyFacts": ["Important factual statements about the case"],
  "people": [{"name": "Person Name", "role": "Their role if mentioned"}],
  "dates": [{"date": "Date mentioned", "context": "What the date refers to"}],
  "actionItems": ["Tasks or follow-ups needed"],
  "aiNoticed": "Any concerns, contradictions, hesitations, or items worth following up on"
}

Be concise. Focus on legally relevant information.
Return ONLY valid JSON, no other text.

TRANSCRIPT:
`;

export const extractInfo = async (transcript: string): Promise<ExtractedInfo> => {
  const messages = [
    {
      role: 'user' as const,
      content: EXTRACTION_PROMPT + transcript,
    },
  ];

  try {
    const response = await completion(messages, {
      maxTokens: 1500,
      temperature: 0.2,
    });

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        keyFacts: parsed.keyFacts || [],
        people: parsed.people || [],
        dates: parsed.dates || [],
        actionItems: parsed.actionItems || [],
        aiNoticed: parsed.aiNoticed || undefined,
      };
    }
    throw new Error('No JSON found in response');
  } catch (e) {
    console.error('Failed to parse extraction:', e);
    // Return empty structure on failure
    return {
      keyFacts: [],
      people: [],
      dates: [],
      actionItems: [],
      aiNoticed: 'Unable to extract information automatically.',
    };
  }
};

// Demo extraction for pre-loaded data
export const extractInfoDemo = async (transcript: string): Promise<ExtractedInfo> => {
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Return realistic extraction based on transcript content
  const keyFacts: string[] = [];
  const people: { name: string; role?: string }[] = [];
  const dates: { date: string; context: string }[] = [];
  const actionItems: string[] = [];

  // Simple keyword extraction for demo
  if (transcript.toLowerCase().includes('contract')) {
    keyFacts.push('Discussion involved contractual matters');
  }
  if (transcript.toLowerCase().includes('damages')) {
    keyFacts.push('Potential damages were discussed');
  }
  if (transcript.toLowerCase().includes('email')) {
    keyFacts.push('Email communications are relevant to the case');
    actionItems.push('Request email records');
  }

  // Extract names (simple pattern matching)
  const namePattern = /(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g;
  let match;
  while ((match = namePattern.exec(transcript)) !== null) {
    people.push({ name: match[1] });
  }

  // Extract dates
  const datePattern = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?/gi;
  while ((match = datePattern.exec(transcript)) !== null) {
    dates.push({ date: match[0], context: 'Mentioned in transcript' });
  }

  return {
    keyFacts: keyFacts.length > 0 ? keyFacts : ['Meeting recorded successfully'],
    people,
    dates,
    actionItems: actionItems.length > 0 ? actionItems : ['Review transcript for follow-up items'],
    aiNoticed: 'Transcript analysis complete. Review highlighted sections for potential concerns.',
  };
};
