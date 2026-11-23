import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Motion Sort', () => {
  it('steps through a sort with buttons and keys', async () => {
    window.location.hash = '/visualize';
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByTestId('note')).toHaveTextContent('Start');
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByTestId('step')).toHaveTextContent(/^Step 1 \//);
    fireEvent.keyDown(screen.getByTestId('note'), { key: 'ArrowRight' });
    expect(screen.getByTestId('step')).toHaveTextContent(/^Step 2 \//);
    await user.click(screen.getByRole('button', { name: 'Last step' }));
    expect(screen.getByTestId('note')).toHaveTextContent('Sorted');
  });

  it('plays automatically', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.location.hash = '/visualize';
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Play' }));
    await act(async () => { vi.advanceTimersByTime(2200); });
    expect(Number(screen.getByTestId('cmp').textContent)).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('accepts custom numbers and validates them', async () => {
    window.location.hash = '/visualize';
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: 'Bubble sort' }));
    await user.type(screen.getByLabelText(/your own numbers/), '3, x');
    await user.click(screen.getByRole('button', { name: 'Use these' }));
    expect(screen.getByText(/numbers only/)).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/your own numbers/));
    await user.type(screen.getByLabelText(/your own numbers/), '1 2 3 4');
    await user.click(screen.getByRole('button', { name: 'Use these' }));
    await user.click(screen.getByRole('button', { name: 'Last step' }));
    expect(screen.getByTestId('cmp')).toHaveTextContent('3');
  });

  it('runs a binary search', async () => {
    window.location.hash = '/visualize';
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: 'Binary search' }));
    await user.selectOptions(screen.getByLabelText('Search for'), '1000');
    await user.click(screen.getByRole('button', { name: 'Last step' }));
    expect(screen.getByTestId('note')).toHaveTextContent('1000 is not in the list');
  });

  it('races two algorithms and compares counts', async () => {
    window.location.hash = '/race';
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(screen.getByRole('button', { name: 'Last step' }));
    expect(screen.getByText(/finished first|A tie/)).toBeInTheDocument();
    unmount();
    window.location.hash = '/compare';
    render(<App />);
    expect(screen.getByRole('table', { name: /Complexity/ })).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Bubble sort, Already sorted: 31 comparisons/)).toHaveLength(1);
  });
});
