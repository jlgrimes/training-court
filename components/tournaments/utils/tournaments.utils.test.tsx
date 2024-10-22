import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import TournamentRoundEdit, { TournamentRoundEditProps } from '../AddTournamentRound/TournamentRoundEdit';
import '@testing-library/jest-dom';

const defaultProps: TournamentRoundEditProps = {
  editing: false,
  setEditing: jest.fn(),
  tournamentId: 'tournament-123',
  userId: 'user-123',
  editedRoundNumber: 1,
  existingRound: undefined,
  updateClientRounds: jest.fn(),
};

describe('TournamentRoundEdit', () => {
  it('renders a button to add or update a round', () => {
    render(<TournamentRoundEdit {...defaultProps} />);

    const addButton = screen.getByRole('button', { name: /add round/i });
    expect(addButton).toBeInTheDocument();
  });

  it('opens edit mode when clicking the "Add round" button', async () => {
    render(<TournamentRoundEdit {...defaultProps} />);
    const addButton = screen.getByRole('button', { name: /add round/i });
    fireEvent.click(addButton);

    expect(defaultProps.setEditing).toHaveBeenCalledWith(true);
  });

  it('displays round details when in editing mode', async () => {
    await act(async () => {
      render(<TournamentRoundEdit {...defaultProps} editing={true} />);
    });

    const roundTitle = screen.getByText(/round 1/i);
    expect(roundTitle).toBeInTheDocument();
  });

});
