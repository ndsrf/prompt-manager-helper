import { render, screen } from '@testing-library/react';
import { TokenCounter } from '../TokenCounter';

describe('TokenCounter', () => {
  it('should render character count', () => {
    const content = 'Hello World';
    render(<TokenCounter content={content} />);

    expect(screen.getByText(/11 chars/i)).toBeInTheDocument();
  });

  it('should render word count', () => {
    const content = 'Hello World Test';
    render(<TokenCounter content={content} />);

    expect(screen.getByText(/3 words/i)).toBeInTheDocument();
  });

  it('should estimate token count for GPT-4', () => {
    const content = 'Hello World Test';
    render(<TokenCounter content={content} model="gpt-4" />);

    // ~3 words * 0.75 = ~2-3 tokens
    expect(screen.getByText(/~\d+ tokens/i)).toBeInTheDocument();
  });

  it('should handle empty content', () => {
    render(<TokenCounter content="" />);

    expect(screen.getByText(/0 chars/i)).toBeInTheDocument();
    expect(screen.getByText(/0 words/i)).toBeInTheDocument();
    expect(screen.getByText(/~0 tokens/i)).toBeInTheDocument();
  });

  it('should handle long content with punctuation', () => {
    const content = 'Hello, World! This is a test. How are you?';
    render(<TokenCounter content={content} model="gpt-4" />);

    expect(screen.getByText(new RegExp(content.length + ' chars'))).toBeInTheDocument();
  });

  it('should estimate tokens for Claude model', () => {
    const content = 'This is a test prompt for Claude';
    render(<TokenCounter content={content} model="claude" />);

    // Claude uses ~4 chars per token
    const expectedTokens = Math.ceil(content.length / 4);
    expect(screen.getByText(new RegExp(`~${expectedTokens} tokens`))).toBeInTheDocument();
  });

  it('should update when content changes', () => {
    const { rerender } = render(<TokenCounter content="Short" />);
    expect(screen.getByText(/5 chars/i)).toBeInTheDocument();

    rerender(<TokenCounter content="Much longer content here" />);
    expect(screen.getByText(/24 chars/i)).toBeInTheDocument();
  });

  it('should handle content with newlines', () => {
    const content = 'Line 1\nLine 2\nLine 3';
    render(<TokenCounter content={content} />);

    // "Line 1\nLine 2\nLine 3" has 6 words (counting numbers as words)
    expect(screen.getByText(/6 words/i)).toBeInTheDocument();
  });

  it('should count single word correctly', () => {
    const content = 'Hello';
    render(<TokenCounter content={content} />);

    expect(screen.getByText(/1 word/i)).toBeInTheDocument();
  });

  it('should handle content with multiple spaces', () => {
    const content = 'Hello    World';
    render(<TokenCounter content={content} />);

    // Should still count as 2 words
    expect(screen.getByText(/2 words/i)).toBeInTheDocument();
  });
});
