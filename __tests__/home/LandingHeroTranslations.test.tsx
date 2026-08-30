import React from 'react';
import { render, screen } from '@testing-library/react';
import LandingHeroTranslations from '../../components/general-translation/LandingHeroTranslations';

jest.mock('../../hooks/useUiRefresh', () => ({
  useUiRefresh: () => ({ enabled: true, ready: true }),
}));

jest.mock('gt-react', () => ({
  T: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('LandingHeroTranslations', () => {
  it('sends Get started to /login', () => {
    render(<LandingHeroTranslations />);
    expect(screen.getByRole('link').getAttribute('href')).toBe('/login');
    expect(screen.getByText('Get started')).toBeTruthy();
  });
});
