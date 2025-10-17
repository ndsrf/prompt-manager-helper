import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagDialog } from '../TagDialog';

// Mock tRPC
const mockCreateTag = jest.fn();
const mockUpdateTag = jest.fn();

jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    tag: {
      create: {
        useMutation: jest.fn(),
      },
      update: {
        useMutation: jest.fn(),
      },
    },
  },
}));

// Mock toast
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

const { trpc } = require('@/lib/trpc/client');

describe('TagDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    trpc.tag.create.useMutation.mockReturnValue({
      mutateAsync: mockCreateTag.mockResolvedValue({
        id: 'new-tag-id',
        name: 'New Tag',
        color: '#FF0000',
      }),
    });

    trpc.tag.update.useMutation.mockReturnValue({
      mutateAsync: mockUpdateTag.mockResolvedValue({
        id: 'tag-1',
        name: 'Updated Tag',
        color: '#00FF00',
      }),
    });
  });

  describe('Create mode', () => {
    it('should render create dialog when open', () => {
      render(<TagDialog open={true} onOpenChange={jest.fn()} onSuccess={jest.fn()} />);

      expect(screen.getByText(/create tag/i)).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<TagDialog open={false} onOpenChange={jest.fn()} onSuccess={jest.fn()} />);

      expect(screen.queryByText(/create tag/i)).not.toBeInTheDocument();
    });

    it('should have name and color inputs', () => {
      render(<TagDialog open={true} onOpenChange={jest.fn()} onSuccess={jest.fn()} />);

      expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
      expect(screen.getByText(/^color/i)).toBeInTheDocument();
    });

    it('should create tag on submit', async () => {
      const onOpenChange = jest.fn();
      const onSuccess = jest.fn();

      render(
        <TagDialog
          open={true}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      );

      const nameInput = screen.getByLabelText(/^name/i);
      await userEvent.type(nameInput, 'New Tag');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateTag).toHaveBeenCalledWith({
          name: 'New Tag',
          color: expect.stringMatching(/^#[0-9A-Fa-f]{6}$/), // Default color
        });
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should show validation error for empty name', async () => {
      render(<TagDialog open={true} onOpenChange={jest.fn()} onSuccess={jest.fn()} />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });

      expect(mockCreateTag).not.toHaveBeenCalled();
    });

    it('should allow selecting different colors', async () => {
      render(<TagDialog open={true} onOpenChange={jest.fn()} onSuccess={jest.fn()} />);

      const nameInput = screen.getByLabelText(/^name/i);
      await userEvent.type(nameInput, 'Test Tag');

      // Find color buttons and click one
      const colorButtons = screen.getAllByRole('button').filter(btn =>
        btn.style.backgroundColor && btn.type === 'button' && !btn.textContent
      );

      expect(colorButtons.length).toBeGreaterThan(0);
      await userEvent.click(colorButtons[2]); // Select third color

      const submitButton = screen.getByRole('button', { name: /create/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateTag).toHaveBeenCalledWith({
          name: 'Test Tag',
          color: expect.stringMatching(/^#[0-9A-Fa-f]{6}$/),
        });
      });
    });
  });

  describe('Edit mode', () => {
    const existingTag = {
      id: 'tag-1',
      name: 'Existing Tag',
      color: '#00FF00',
    };

    it('should render edit dialog with existing values', () => {
      render(
        <TagDialog
          open={true}
          onOpenChange={jest.fn()}
          tag={existingTag}
          onSuccess={jest.fn()}
        />
      );

      expect(screen.getByText(/edit tag/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Tag')).toBeInTheDocument();
    });

    it('should update tag on submit', async () => {
      const onOpenChange = jest.fn();
      const onSuccess = jest.fn();

      render(
        <TagDialog
          open={true}
          onOpenChange={onOpenChange}
          tag={existingTag}
          onSuccess={onSuccess}
        />
      );

      const nameInput = screen.getByLabelText(/^name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Tag');

      const submitButton = screen.getByRole('button', { name: /update/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateTag).toHaveBeenCalledWith({
          id: 'tag-1',
          name: 'Updated Tag',
          color: '#00FF00',
        });
      });

      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should show error toast on create failure', async () => {
      // Set up the mutation to reject before rendering
      const mockError = new Error('Failed to create tag');
      trpc.tag.create.useMutation.mockReturnValue({
        mutateAsync: jest.fn().mockRejectedValue(mockError),
      });

      render(<TagDialog open={true} onOpenChange={jest.fn()} onSuccess={jest.fn()} />);

      const nameInput = screen.getByLabelText(/^name/i);
      await userEvent.type(nameInput, 'Test Tag');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Cancel button', () => {
    it('should close dialog without saving', async () => {
      const onOpenChange = jest.fn();

      render(<TagDialog open={true} onOpenChange={onOpenChange} onSuccess={jest.fn()} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(mockCreateTag).not.toHaveBeenCalled();
    });
  });
});
