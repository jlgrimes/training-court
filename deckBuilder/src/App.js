import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Typography, Button, Box } from '@mui/material';
import DeckState from './context/decks/DeckState';
import { AuthState } from './context/auth/AuthState';
import NewDeckBuilder from './components/NewDeckBuilder';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [deckBuilderOpen, setDeckBuilderOpen] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthState>
        <DeckState>
          <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
              <Typography variant="h3" component="h1" gutterBottom>
                Pokemon TCG Deck Builder
              </Typography>
              <Typography variant="body1" gutterBottom>
                Build and manage your Pokemon TCG decks with ease.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => setDeckBuilderOpen(true)}
                sx={{ mt: 2 }}
              >
                Create New Deck
              </Button>
            </Box>

            <NewDeckBuilder 
              isOpen={deckBuilderOpen}
              onClose={() => setDeckBuilderOpen(false)}
            />
          </Container>
        </DeckState>
      </AuthState>
    </ThemeProvider>
  );
}

export default App;