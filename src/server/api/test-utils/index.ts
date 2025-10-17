import { type Session } from 'next-auth';
import { type PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Mock Prisma client
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});

// Helper to create a mock session
export const createMockSession = (overrides?: Partial<Session>): Session => {
  return {
    user: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      name: 'Test User',
      ...overrides?.user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
};

// Helper to create a mock context for tRPC procedures
export const createMockContext = (session?: Session | null) => {
  return {
    session: session ?? createMockSession(),
    prisma: prismaMock,
  };
};

// Test data factories
export const createTestUser = (overrides?: any) => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: null,
  emailVerified: true,
  avatarUrl: null,
  provider: 'email',
  providerId: null,
  subscriptionTier: 'free',
  subscriptionStatus: 'active',
  subscriptionExpiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLogin: new Date(),
  settings: {},
  ...overrides,
});

export const createTestFolder = (overrides?: any) => ({
  id: '550e8400-e29b-41d4-a716-446655440001',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  parentId: null,
  name: 'Test Folder',
  description: 'Test folder description',
  path: '',
  level: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestTag = (overrides?: any) => ({
  id: '550e8400-e29b-41d4-a716-446655440002',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'test-tag',
  color: '#FF5733',
  createdAt: new Date(),
  ...overrides,
});

export const createTestPrompt = (overrides?: any) => ({
  id: '550e8400-e29b-41d4-a716-446655440003',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  folderId: null,
  title: 'Test Prompt',
  description: 'Test prompt description',
  content: 'This is a test prompt with {{variable}}',
  variables: [
    { name: 'variable', type: 'text', default: 'value' }
  ],
  targetLlm: 'chatgpt',
  isFavorite: false,
  isDeleted: false,
  privacy: 'private',
  usageCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestPromptVersion = (overrides?: any) => ({
  id: '550e8400-e29b-41d4-a716-446655440004',
  promptId: '550e8400-e29b-41d4-a716-446655440003',
  versionNumber: 1,
  title: 'Test Prompt',
  content: 'This is version 1',
  variables: [],
  changesSummary: 'Initial version',
  annotation: null,
  isSnapshot: true,
  createdBy: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: new Date(),
  ...overrides,
});
