import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleTemplates = [
  {
    name: 'Blog Post Writer',
    description: 'Generate a well-structured blog post on any topic with introduction, body, and conclusion',
    category: 'Content Writing',
    content: `Write a comprehensive blog post about {{topic}}.

Requirements:
- Target audience: {{audience}}
- Tone: {{tone}}
- Word count: approximately {{wordCount}} words

Structure:
1. Compelling headline
2. Engaging introduction with a hook
3. Main content divided into clear sections with subheadings
4. Conclusion with key takeaways
5. Call-to-action

Please ensure the content is well-researched, informative, and engaging.`,
    variables: [
      { name: 'topic', type: 'text', default: 'AI in healthcare' },
      { name: 'audience', type: 'text', default: 'general public' },
      { name: 'tone', type: 'select', default: 'professional', options: ['professional', 'casual', 'technical', 'friendly'] },
      { name: 'wordCount', type: 'number', default: '1000' },
    ],
    targetLlm: 'chatgpt',
  },
  {
    name: 'Code Review Assistant',
    description: 'Get detailed code review feedback with suggestions for improvements',
    category: 'Programming',
    content: `Please review the following {{language}} code and provide detailed feedback:

\`\`\`{{language}}
{{code}}
\`\`\`

Focus on:
1. Code quality and best practices
2. Performance optimization opportunities
3. Security vulnerabilities
4. Maintainability and readability
5. Potential bugs or edge cases
6. Suggested improvements with examples

Provide specific, actionable recommendations.`,
    variables: [
      { name: 'language', type: 'select', default: 'javascript', options: ['javascript', 'python', 'typescript', 'java', 'go', 'rust'] },
      { name: 'code', type: 'text', default: '// Paste your code here' },
    ],
    targetLlm: 'claude',
  },
  {
    name: 'Product Description Generator',
    description: 'Create compelling product descriptions for e-commerce',
    category: 'Marketing',
    content: `Create a compelling product description for {{productName}}.

Product Details:
- Category: {{category}}
- Key Features: {{features}}
- Target Audience: {{targetAudience}}
- Price Range: {{priceRange}}

Requirements:
1. Attention-grabbing headline
2. Highlight unique selling points
3. Address customer pain points
4. Include benefits (not just features)
5. Create urgency or desire
6. SEO-friendly keywords
7. Professional yet persuasive tone

Length: {{length}} words`,
    variables: [
      { name: 'productName', type: 'text', default: '' },
      { name: 'category', type: 'text', default: '' },
      { name: 'features', type: 'text', default: '' },
      { name: 'targetAudience', type: 'text', default: '' },
      { name: 'priceRange', type: 'select', default: 'mid', options: ['budget', 'mid', 'premium', 'luxury'] },
      { name: 'length', type: 'number', default: '150' },
    ],
    targetLlm: null,
  },
  {
    name: 'Email Reply Assistant',
    description: 'Draft professional email responses based on context',
    category: 'Communication',
    content: `I received the following email and need help drafting a response:

Original Email:
{{originalEmail}}

Context:
- Relationship: {{relationship}}
- Tone needed: {{tone}}
- Key points to address: {{keyPoints}}

Please draft a professional response that:
1. Acknowledges the original message
2. Addresses all key points raised
3. Maintains appropriate tone
4. Is clear and concise
5. Includes proper greeting and closing`,
    variables: [
      { name: 'originalEmail', type: 'text', default: '' },
      { name: 'relationship', type: 'select', default: 'colleague', options: ['boss', 'colleague', 'client', 'vendor', 'team member'] },
      { name: 'tone', type: 'select', default: 'professional', options: ['formal', 'professional', 'friendly', 'apologetic'] },
      { name: 'keyPoints', type: 'text', default: '' },
    ],
    targetLlm: null,
  },
  {
    name: 'Social Media Content Creator',
    description: 'Generate engaging social media posts for different platforms',
    category: 'Marketing',
    content: `Create {{postCount}} engaging social media posts for {{platform}} about {{topic}}.

Brand Voice: {{brandVoice}}
Target Audience: {{targetAudience}}
Call-to-Action: {{cta}}

Requirements:
1. Platform-appropriate length and format
2. Include relevant hashtags ({{hashtagCount}})
3. Engaging hooks or questions
4. Visual content suggestions
5. Best posting time recommendations

Make the content shareable and aligned with current trends.`,
    variables: [
      { name: 'platform', type: 'select', default: 'instagram', options: ['instagram', 'twitter', 'linkedin', 'facebook', 'tiktok'] },
      { name: 'topic', type: 'text', default: '' },
      { name: 'postCount', type: 'number', default: '5' },
      { name: 'brandVoice', type: 'select', default: 'professional', options: ['professional', 'casual', 'witty', 'inspirational', 'educational'] },
      { name: 'targetAudience', type: 'text', default: '' },
      { name: 'cta', type: 'text', default: '' },
      { name: 'hashtagCount', type: 'number', default: '5' },
    ],
    targetLlm: 'chatgpt',
  },
  {
    name: 'Interview Question Preparer',
    description: 'Generate interview questions and sample answers for any role',
    category: 'Career',
    content: `Generate {{questionCount}} interview questions for a {{jobTitle}} position with sample answers.

Company Type: {{companyType}}
Experience Level: {{experienceLevel}}
Focus Areas: {{focusAreas}}

For each question provide:
1. The interview question
2. What the interviewer is looking for
3. A strong sample answer with the STAR method (Situation, Task, Action, Result)
4. Common mistakes to avoid
5. Follow-up questions they might ask

Mix of behavioral, technical, and situational questions.`,
    variables: [
      { name: 'jobTitle', type: 'text', default: 'Software Engineer' },
      { name: 'questionCount', type: 'number', default: '10' },
      { name: 'companyType', type: 'select', default: 'tech startup', options: ['tech startup', 'enterprise', 'consulting', 'agency', 'non-profit'] },
      { name: 'experienceLevel', type: 'select', default: 'mid-level', options: ['entry-level', 'mid-level', 'senior', 'lead', 'executive'] },
      { name: 'focusAreas', type: 'text', default: 'technical skills, teamwork, problem-solving' },
    ],
    targetLlm: 'claude',
  },
  {
    name: 'Learning Path Generator',
    description: 'Create a structured learning path for any skill or topic',
    category: 'Education',
    content: `Create a comprehensive learning path for mastering {{skill}}.

Current Level: {{currentLevel}}
Target Level: {{targetLevel}}
Available Time: {{timeCommitment}} hours per week
Learning Style: {{learningStyle}}
Goal Deadline: {{deadline}}

Please provide:
1. Skill assessment and gap analysis
2. Week-by-week learning plan
3. Recommended resources (courses, books, tutorials)
4. Practice projects and exercises
5. Milestones and checkpoints
6. Assessment methods
7. Common pitfalls to avoid

Make it practical and actionable.`,
    variables: [
      { name: 'skill', type: 'text', default: '' },
      { name: 'currentLevel', type: 'select', default: 'beginner', options: ['absolute beginner', 'beginner', 'intermediate', 'advanced'] },
      { name: 'targetLevel', type: 'select', default: 'intermediate', options: ['beginner', 'intermediate', 'advanced', 'expert'] },
      { name: 'timeCommitment', type: 'number', default: '10' },
      { name: 'learningStyle', type: 'select', default: 'mixed', options: ['visual', 'hands-on', 'reading', 'video', 'mixed'] },
      { name: 'deadline', type: 'text', default: '3 months' },
    ],
    targetLlm: null,
  },
  {
    name: 'Business Idea Analyzer',
    description: 'Analyze and validate business ideas with market research',
    category: 'Business',
    content: `Analyze the following business idea and provide comprehensive feedback:

Business Idea: {{businessIdea}}
Target Market: {{targetMarket}}
Budget: {{budget}}
Timeline: {{timeline}}

Please analyze:
1. Market Opportunity
   - Market size and growth potential
   - Target customer profile
   - Market gaps and needs

2. Competitive Analysis
   - Direct and indirect competitors
   - Competitive advantages
   - Market positioning

3. Feasibility Assessment
   - Required resources
   - Technical challenges
   - Regulatory considerations

4. Revenue Model
   - Potential revenue streams
   - Pricing strategy suggestions
   - Unit economics

5. Risk Analysis
   - Key risks and challenges
   - Mitigation strategies

6. Next Steps
   - Immediate action items
   - Validation methods
   - MVP recommendations

Be honest and realistic in the assessment.`,
    variables: [
      { name: 'businessIdea', type: 'text', default: '' },
      { name: 'targetMarket', type: 'text', default: '' },
      { name: 'budget', type: 'select', default: 'under 10k', options: ['under 10k', '10k-50k', '50k-100k', '100k+', 'bootstrapped'] },
      { name: 'timeline', type: 'text', default: '6 months' },
    ],
    targetLlm: 'chatgpt',
  },
  {
    name: 'Meeting Summarizer',
    description: 'Summarize meeting notes into action items and key decisions',
    category: 'Productivity',
    content: `Summarize the following meeting notes:

Meeting Type: {{meetingType}}
Attendees: {{attendees}}

Notes:
{{meetingNotes}}

Please provide:
1. Executive Summary (2-3 sentences)
2. Key Discussion Points
3. Decisions Made
4. Action Items (with owners and deadlines if mentioned)
5. Open Questions/Follow-ups
6. Next Meeting Agenda (if applicable)

Format for easy sharing and reference.`,
    variables: [
      { name: 'meetingType', type: 'select', default: 'team meeting', options: ['team meeting', 'client meeting', 'brainstorming', '1-on-1', 'all-hands', 'retrospective'] },
      { name: 'attendees', type: 'text', default: '' },
      { name: 'meetingNotes', type: 'text', default: '' },
    ],
    targetLlm: null,
  },
  {
    name: 'Bug Report Generator',
    description: 'Create detailed bug reports from descriptions',
    category: 'Programming',
    content: `Create a detailed bug report based on the following information:

Bug Description: {{description}}
Environment: {{environment}}
Severity: {{severity}}

Generate a comprehensive bug report including:

**Title:** Clear, concise title

**Environment:**
- OS:
- Browser/Platform:
- Version:
{{environment}}

**Steps to Reproduce:**
1. [Step-by-step instructions]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots/Logs:**
[If applicable]

**Severity:** {{severity}}

**Possible Cause:**
[Technical analysis if possible]

**Suggested Fix:**
[If you have ideas]

**Additional Context:**
[Any other relevant information]`,
    variables: [
      { name: 'description', type: 'text', default: '' },
      { name: 'environment', type: 'text', default: '' },
      { name: 'severity', type: 'select', default: 'medium', options: ['critical', 'high', 'medium', 'low', 'trivial'] },
    ],
    targetLlm: 'claude',
  },
];

async function main() {
  console.log('Seeding prompt templates...');

  for (const template of sampleTemplates) {
    const created = await prisma.promptTemplate.create({
      data: {
        ...template,
        variables: template.variables as any,
      },
    });
    console.log(`Created template: ${created.name}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
