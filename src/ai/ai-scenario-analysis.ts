// This file contains the Genkit flow for AI-powered scenario analysis to suggest alternative farming practices.

'use server';

/**
 * @fileOverview This file defines the AI scenario analysis flow for suggesting alternative farming practices.
 *
 * - aiScenarioAnalysis - A function that suggests alternative farming practices to reduce emission intensities.
 * - AIScenarioAnalysisInput - The input type for the aiScenarioAnalysis function.
 * - AIScenarioAnalysisOutput - The return type for the aiScenarioAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIScenarioAnalysisInputSchema = z.object({
  currentPractices: z
    .string()
    .describe('A detailed description of the current farming practices.'),
  relevantResearchData: z
    .string()
    .describe(
      'Relevant research data related to farming practices and emission intensities.'
    ),
});
export type AIScenarioAnalysisInput = z.infer<typeof AIScenarioAnalysisInputSchema>;

const AIScenarioAnalysisOutputSchema = z.object({
  suggestedPractices: z
    .string()
    .describe(
      'A list of suggested alternative farming practices to reduce emission intensities.'
    ),
  justification: z
    .string()
    .describe(
      'A justification for each suggested practice based on the provided research data.'
    ),
});
export type AIScenarioAnalysisOutput = z.infer<typeof AIScenarioAnalysisOutputSchema>;

export async function aiScenarioAnalysis(
  input: AIScenarioAnalysisInput
): Promise<AIScenarioAnalysisOutput> {
  return aiScenarioAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiScenarioAnalysisPrompt',
  input: {schema: AIScenarioAnalysisInputSchema},
  output: {schema: AIScenarioAnalysisOutputSchema},
  prompt: `You are an AI assistant designed to suggest alternative farming practices to reduce emission intensities.

  Based on the user's current practices and relevant research data, provide a list of suggested practices and a justification for each.

Current Practices: {{{currentPractices}}}

Relevant Research Data: {{{relevantResearchData}}}

Suggestions:
`,
});

const aiScenarioAnalysisFlow = ai.defineFlow(
  {
    name: 'aiScenarioAnalysisFlow',
    inputSchema: AIScenarioAnalysisInputSchema,
    outputSchema: AIScenarioAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
