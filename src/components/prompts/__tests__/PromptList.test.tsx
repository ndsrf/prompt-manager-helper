import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptList } from '../PromptList';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock tRPC client
const mockRefetch = jest.fn();
const mockToggleFavorite = jest.fn();
const mockDelete = jest.fn();

jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    prompt: {
      getAll: {
        useQuery: jest.fn(),
      },
      toggleFavorite: {
        useMutation: jest.fn(),
      },
      delete: {
        useMutation: jest.fn(),
      },
    },
  },
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const { trpc } = require('@/lib/trpc/client');

describe('PromptList', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    trpc.prompt.getAll.useQuery.mockReturnValue({
      data: { prompts: [] },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    trpc.prompt.toggleFavorite.useMutation.mockReturnValue({
      mutateAsync: mockToggleFavorite,
    });

    trpc.prompt.delete.useMutation.mockReturnValue({
      mutateAsync: mockDelete,
    });
  });

  describe('Loading state', () => {
    it('should show loading skeletons when loading', () => {
      trpc.prompt.getAll.useQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      render(<PromptList />);

      // Check for skeleton elements
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no prompts exist', () => {
      render(<PromptList />);

      expect(screen.getByText(/no prompts found/i)).toBeInTheDocument();
    });

    it('should show search-specific empty message when searching', () => {
      render(<PromptList search="test query" />);

      expect(screen.getByText(/try adjusting your search/i)).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should show error message when query fails', () => {
      trpc.prompt.getAll.useQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Failed to fetch prompts' },
        refetch: mockRefetch,
      });

      render(<PromptList />);

      expect(screen.getByText(/error loading prompts/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to fetch prompts/i)).toBeInTheDocument();
    });

    it('should show retry button on error', async () => {
      trpc.prompt.getAll.useQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Network error' },
        refetch: mockRefetch,
      });

      render(<PromptList />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await userEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Prompts display', () => {
    const mockPrompts = [
      {
        id: '1',
        title: 'Test Prompt 1',
        description: 'Description 1',
        content: 'Content 1',
        isFavorite: false,
        updatedAt: new Date().toISOString(),
        folder: { name: 'Folder 1' },
        tags: [{ tag: { id: 't1', name: 'tag1', color: '#FF0000' } }],
        _count: { versions: 2 },
      },
      {
        id: '2',
        title: 'Test Prompt 2',
        description: 'Description 2',
        content: 'Content 2',
        isFavorite: true,
        updatedAt: new Date().toISOString(),
        folder: null,
        tags: [],
        _count: { versions: 0 },
      },
    ];

    it('should render list of prompts', () => {
      trpc.prompt.getAll.useQuery.mockReturnValue({
        data: { prompts: mockPrompts },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<PromptList />);

      expect(screen.getByText('Test Prompt 1')).toBeInTheDocument();
      expect(screen.getByText('Test Prompt 2')).toBeInTheDocument();
    });

    it('should display prompt descriptions', () => {
      trpc.prompt.getAll.useQuery.mockReturnValue({
        data: { prompts: mockPrompts },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<PromptList />);

      expect(screen.getByText('Description 1')).toBeInTheDocument();
      expect(screen.getByText('Description 2')).toBeInTheDocument();
    });

    it('should display folder names', () => {
      trpc.prompt.getAll.useQuery.mockReturnValue({
        data: { prompts: mockPrompts },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<PromptList />);

      expect(screen.getByText('Folder 1')).toBeInTheDocument();
    });

    it('should display tags', () => {
      trpc.prompt.getAll.useQuery.mockReturnValue({
        data: { prompts: mockPrompts },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<PromptList />);

      expect(screen.getByText('tag1')).toBeInTheDocument();
    });

    it('should display version count', () => {
      trpc.prompt.getAll.useQuery.mockReturnValue({
        data: { prompts: mockPrompts },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<PromptList />);

      expect(screen.getByText('2 versions')).toBeInTheDocument();
    });
  });

  describe('Filters', () => {
    it('should pass folder filter to query', () => {
      render(<PromptList folderId="folder-123" />);

      expect(trpc.prompt.getAll.useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          folderId: 'folder-123',
        })
      );
    });

    it('should pass tag filter to query', () => {
      render(<PromptList tagIds={['tag1', 'tag2']} />);

      expect(trpc.prompt.getAll.useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          tagIds: ['tag1', 'tag2'],
        })
      );
    });

    it('should pass search query to query', () => {
      render(<PromptList search="test search" />);

      expect(trpc.prompt.getAll.useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test search',
        })
      );
    });
  });
});
