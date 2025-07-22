# Pokemon TCG Deck Builder

A standalone React component for building Pokemon Trading Card Game decks.

## Features

- Search Pokemon TCG cards by name, type, and other filters
- Build 60-card decks with validation
- Import/Export decks in various formats (clipboard, PDF, text)
- Select custom sprites for deck icons
- Works with or without backend API (uses local storage as fallback)

## Installation

```bash
npm install
```

## Running the App

```bash
npm start
```

The app will run on http://localhost:3000

## Configuration

### Environment Variables

- `REACT_APP_API_URL`: Backend API URL (defaults to http://localhost:5100)
- `NODE_ENV`: Set to 'development' or 'production'

### API Integration

The deck builder can work in two modes:

1. **With API**: Connect to a backend that provides deck persistence
2. **Standalone**: Uses local storage for deck management

## Usage

### Basic Usage

```jsx
import NewDeckBuilder from './components/NewDeckBuilder';
import DeckState from './context/decks/DeckState';

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DeckState>
      <NewDeckBuilder 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </DeckState>
  );
}
```

### Props

- `isOpen`: Boolean to control modal visibility
- `onClose`: Function called when modal is closed
- `editDeckId`: Optional deck ID for editing existing decks

## Dependencies

- React 18.2+
- Material-UI 7.0+
- Pokemon TCG SDK 2.0+
- Axios for API calls
- jsPDF for PDF export

## Structure

```
deckBuilder/
├── src/
│   ├── components/
│   │   └── NewDeckBuilder.js
│   ├── context/
│   │   ├── auth/
│   │   └── decks/
│   ├── utils/
│   │   ├── api.js
│   │   ├── deckUtils.js
│   │   ├── exportUtils.js
│   │   └── ...
│   └── api/
│       └── pokeApi.js
├── public/
│   └── index.html
└── package.json
```