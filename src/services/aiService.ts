/**
 * Service to handle AI-related functionality for the mind map
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');


// Mock data for AI suggestions (in a real app, this would call an AI service)
const mockSuggestions: Record<string, string[]> = {
  'Central Idea': [
    'Key Feature 1',
    'Key Feature 2',
    'Key Feature 3', 
    'Key Feature 4'
  ],
  'Key Feature 1': [
    'Sub-feature 1.1',
    'Sub-feature 1.2',
    'Benefit 1.1'
  ],
  'Key Feature 2': [
    'Sub-feature 2.1',
    'Sub-feature 2.2',
    'Benefit 2.1'
  ],
  'Key Feature 3': [
    'Sub-feature 3.1',
    'Sub-feature 3.2',
    'Benefit 3.1'
  ],
  'Key Feature 4': [
    'Sub-feature 4.1',
    'Sub-feature 4.2',
    'Benefit 4.1'
  ],
  'Marketing': [
    'Social Media',
    'Content Strategy',
    'Email Campaigns',
    'Analytics'
  ],
  'Social Media': [
    'Instagram',
    'Twitter',
    'Facebook',
    'LinkedIn'
  ],
  'Project': [
    'Timeline',
    'Resources',
    'Budget',
    'Deliverables'
  ],
  'Timeline': [
    'Phase 1',
    'Phase 2',
    'Phase 3',
    'Milestones'
  ],
  'Product': [
    'Features',
    'Roadmap',
    'Competitors',
    'USP'
  ],
};

// Default suggestions for unknown topics
const defaultSuggestions = [
  'Feature 1',
  'Feature 2',
  'Idea 1',
  'Idea 2',
  'Benefit 1',
];

/**
 * Fetch AI suggestions for expanding a node using Gemini API
 */
export const fetchAINodeSuggestions = async (nodeText: string): Promise<string[]> => {
  try {
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Create a prompt for the AI
    const prompt = `Given the following mind map node text: "${nodeText}", 
    generate 4-5 relevant and concise subtopics or related concepts that would make good child nodes in a mind map.
    Each suggestion should be 2-4 words maximum.
    Return only the suggestions as a comma-separated list, no additional text.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the response into an array of suggestions
    const suggestions = text
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 5); // Ensure we only get 5 suggestions max

    return suggestions;
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    // Fallback to default suggestions if API call fails
    return [
      `${nodeText} - Detail 1`,
      `${nodeText} - Detail 2`,
      `${nodeText} - Example`,
      `${nodeText} - Application`,
      'Related Concept'
    ];
  }
};

/**
 * Generate generic suggestions based on the node text
 * This simulates an AI response for nodes without predefined suggestions
 */
const generateGenericSuggestions = (nodeText: string): string[] => {
  // In a real app, this would call an AI API
  // For now, we'll generate some static suggestions based on the text
  
  const words = nodeText.split(' ');
  
  if (words.length === 0) return defaultSuggestions;
  
  // Create somewhat relevant suggestions based on the node text
  return [
    `${nodeText} - Detail 1`,
    `${nodeText} - Detail 2`,
    `${nodeText} - Example`,
    `${nodeText} - Application`,
    words.length > 1 ? words[0] : 'Related Concept'
  ];
};