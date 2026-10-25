import { act, fireEvent, render } from '@testing-library/react';
import { ReplayBoard } from '@/components/battle-logs/Replay/ReplayBoard';
import type { ReplayBoardState } from '@/components/battle-logs/Replay/battle-log-replay.types';

jest.mock('gt-react', () => ({ T: ({ children }: { children: React.ReactNode }) => <>{children}</>, useGT: () => (text: string) => text }));
const cards = { 'id:me2-5_158': { id: 'card', name: 'Dreepy', imageUrl: '/dreepy.png' } };
const before: ReplayBoardState = { playerOrder: ['You'], stadium: null, players: { You: {
  name: 'You', active: null, bench: [], hand: { knownCards: [{ id: 'hand-card', name: 'Dreepy', identifier: 'me2-5_158', known: true }], unknownCount: 0 }, discard: [], prizesRemaining: 6,
} } };
const after: ReplayBoardState = { ...before, players: { You: { ...before.players.You,
  active: { id: 'played', name: 'Dreepy', identifier: 'me2-5_158', damage: 0, attachments: [], status: [] },
  hand: { knownCards: [], unknownCount: 0 },
} } };
let callback: FrameRequestCallback;
let animations: Array<{ cancel: jest.Mock; onfinish: (() => void) | null }>;
let animate: jest.Mock;
const originalAnimate = HTMLElement.prototype.animate;
const originalMatchMedia = window.matchMedia;
beforeEach(() => {
  animations = [];
  animate = jest.fn(() => { const animation = { cancel: jest.fn(), onfinish: null }; animations.push(animation); return animation; });
  HTMLElement.prototype.animate = animate;
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => { callback = fn; return 1; });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const isHand = this.dataset.motionId?.startsWith('hand:');
    return { left: isHand ? 10 : 200, top: isHand ? 300 : 100, width: 80, height: 112, right: 280, bottom: 412, x: 0, y: 0, toJSON: () => ({}) };
  });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  HTMLElement.prototype.animate = originalAnimate;
  window.matchMedia = originalMatchMedia;
});

it('moves a temporary card from the hand coordinates and reveals the destination on arrival', () => {
  const { rerender } = render(<ReplayBoard board={before} perspectivePlayer="You" cardsByKey={cards} />);
  rerender(<ReplayBoard board={after} perspectivePlayer="You" cardsByKey={cards} motionFrame={1} />);
  act(() => callback(0));
  const ghost = document.querySelector<HTMLElement>('[data-card-motion="play"]')!;
  expect(ghost.style.left).toBe('10px');
  expect(ghost.style.top).toBe('300px');
  expect(ghost.querySelector('img')?.getAttribute('src')).toBe('/dreepy.png');
  const destination = document.querySelector<HTMLElement>('[data-motion-id="pokemon:played"]')!;
  expect(destination.style.visibility).toBe('hidden');
  expect(animate.mock.calls[0][0][1].transform).toContain('translate(190px, -200px)');
  act(() => animations[0].onfinish!());
  expect(document.querySelector('[data-card-motion]')).toBeNull();
  expect(destination.style.visibility).toBe('');
});

it('cancels motion on a seek and restores the destination without leaving ghosts', () => {
  const { rerender } = render(<ReplayBoard board={before} perspectivePlayer="You" cardsByKey={cards} />);
  rerender(<ReplayBoard board={after} perspectivePlayer="You" cardsByKey={cards} motionFrame={1} />);
  act(() => callback(0));
  rerender(<ReplayBoard board={after} perspectivePlayer="You" cardsByKey={cards} />);
  expect(animations[0].cancel).toHaveBeenCalled();
  expect(document.querySelector('[data-card-motion]')).toBeNull();
  expect(document.querySelector<HTMLElement>('[data-motion-id="pokemon:played"]')!.style.visibility).toBe('');
});

it('animates retreat and promotion from their previous positions and restores both on arrival', () => {
  const getRect = HTMLElement.prototype.getBoundingClientRect as jest.Mock;
  getRect.mockImplementation(function (this: HTMLElement) {
    const active = this.closest('[data-zone="active"]');
    return { left: active ? 200 : 100, top: active ? 100 : 250, width: 80, height: 112 };
  });
  const active = after.players.You.active!;
  const promoted = { ...active, id: 'promoted' };
  const beforeRetreat = { ...after, players: { You: { ...after.players.You, bench: [promoted] } } };
  const afterRetreat = { ...after, players: { You: { ...after.players.You, active: promoted, bench: [active] } } };
  const { rerender } = render(<ReplayBoard board={beforeRetreat} perspectivePlayer="You" cardsByKey={cards} />);
  rerender(<ReplayBoard board={afterRetreat} perspectivePlayer="You" cardsByKey={cards} motionFrame={2} />);
  act(() => callback(0));
  const ghosts = document.querySelectorAll<HTMLElement>('[data-card-motion="switch"]');
  expect(ghosts).toHaveLength(2);
  expect(ghosts[0].style.left).toBe('100px');
  expect(ghosts[1].style.left).toBe('200px');
  expect(animate.mock.calls[0][0][1].transform).toContain('translate(100px, -150px)');
  expect(animate.mock.calls[1][0][1].transform).toContain('translate(-100px, 150px)');
  const destinations = ['promoted', 'played'].map((id) => document.querySelector<HTMLElement>(`[data-motion-id="pokemon:${id}"]`)!);
  destinations.forEach((destination) => expect(destination.style.visibility).toBe('hidden'));
  act(() => { animations[0].onfinish!(); animations[1].onfinish!(); });
  expect(document.querySelector('[data-card-motion]')).toBeNull();
  destinations.forEach((destination) => expect(destination.style.visibility).toBe(''));
});

it('does not animate direct jumps or reduced-motion transitions', () => {
  const { rerender } = render(<ReplayBoard board={before} perspectivePlayer="You" cardsByKey={cards} />);
  rerender(<ReplayBoard board={after} perspectivePlayer="You" cardsByKey={cards} />);
  expect(animate).not.toHaveBeenCalled();
  rerender(<ReplayBoard board={before} perspectivePlayer="You" cardsByKey={cards} />);
  (window.matchMedia as jest.Mock).mockReturnValue({ matches: true });
  rerender(<ReplayBoard board={after} perspectivePlayer="You" cardsByKey={cards} motionFrame={1} />);
  expect(animate).not.toHaveBeenCalled();
});

it('cancels a moving card when the viewport changes', () => {
  const { rerender } = render(<ReplayBoard board={before} perspectivePlayer="You" cardsByKey={cards} />);
  rerender(<ReplayBoard board={after} perspectivePlayer="You" cardsByKey={cards} motionFrame={1} />);
  act(() => callback(0));
  fireEvent(window, new Event('resize'));
  expect(document.querySelector('[data-card-motion]')).toBeNull();
  expect(animations[0].cancel).toHaveBeenCalled();
});


it('starts an opponent hand play face-down and reveals only the played Pokemon in flight', () => {
  jest.useFakeTimers({ doNotFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
  const { rerender } = render(<ReplayBoard board={before} perspectivePlayer="Opponent" cardsByKey={cards} />);
  rerender(<ReplayBoard board={after} perspectivePlayer="Opponent" cardsByKey={cards} motionFrame={1} />);
  act(() => callback(0));
  const ghost = document.querySelector<HTMLElement>('[data-card-motion="play"]')!;
  expect(ghost.style.backgroundImage).toContain('pokemon-card-back.jpg');
  expect(ghost.querySelector('img')).toBeNull();
  act(() => jest.advanceTimersByTime(100));
  expect(ghost.querySelector('img')?.getAttribute('src')).toBe('/dreepy.png');
});
