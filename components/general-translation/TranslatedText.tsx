'use client';

import { T } from 'gt-react';
import type { PropsWithChildren } from 'react';

interface TranslatedTextProps extends PropsWithChildren {
  id: string;
}

export function TranslatedText({ id, children }: TranslatedTextProps) {
  switch (id) {
    case "about.header": return <T id="about.header">About</T>;
    case "about.paragraph1": return <T id="about.paragraph1">Training Court was made to consolidate all of your tournaments and practice rounds for the Pokemon Trading Card Game. It was made to be as easy-to-use and accessible as possible, with the player at the forefront of design.</T>;
    case "about.paragraph2": return <T id="about.paragraph2">You can import logs from PTCG Live, and see turns displayed in a beautiful format that&apos;s miles better than the wall of text the battle log gives you. Visualizing the game like this will help with understanding mistakes made in practice, and help in future matches. In the future, expect analytics capabilities to analyze your practice for you!</T>;
    case "about.paragraph3": return <T id="about.paragraph3">You can also track tournaments you play in, including what decks you play against and individual game records for each round. This information persists to your user account, so you&apos;ll always be able to go back and see the games you&apos;ve played in.</T>;
    case "about.paragraph4": return <T id="about.paragraph4">Special thanks to JW Kriewall for helping a ton with development. Hope you all enjoy the app!</T>;
    case "admin.welcome": return <T id="admin.welcome">Welcome admin!</T>;
    case "admin.tabs.feedback": return <T id="admin.tabs.feedback">Feedback</T>;
    case "admin.tabs.avatars": return <T id="admin.tabs.avatars">Avatars</T>;
    case "admin.tabs.users": return <T id="admin.tabs.users">Users</T>;
    case "admin.avatars.mostUsed": return <T id="admin.avatars.mostUsed">Most commonly used avatars:</T>;
    case "admin.avatars.unused": return <T id="admin.avatars.unused">Unused avatars:</T>;
    case "admin.avatars.allUsed": return <T id="admin.avatars.allUsed">All avatars are being used!</T>;
    case "admin.feedback.unresolved": return <T id="admin.feedback.unresolved">Unresolved</T>;
    case "admin.feedback.resolved": return <T id="admin.feedback.resolved">Resolved</T>;
    case "admin.feedback.unresolvedSuffix": return <T id="admin.feedback.unresolvedSuffix">pieces of unresolved feedback. Get to work!</T>;
    case "admin.feedback.fixedPrefix": return <T id="admin.feedback.fixedPrefix">You have fixed</T>;
    case "admin.feedback.fixedSuffix": return <T id="admin.feedback.fixedSuffix">customer feedbacks. Good job!</T>;
    case "admin.users.totalUsers": return <T id="admin.users.totalUsers">Total Users</T>;
    case "admin.users.joinedLastWeek": return <T id="admin.users.joinedLastWeek">Users Joined in Last Week</T>;
    case "admin.users.totalLoggedGames": return <T id="admin.users.totalLoggedGames">Total Logged Games</T>;
    case "auth.email": return <T id="auth.email">Email</T>;
    case "auth.password": return <T id="auth.password">Password</T>;
    case "auth.signingIn": return <T id="auth.signingIn">Signing In...</T>;
    case "auth.signIn": return <T id="auth.signIn">Sign In</T>;
    case "auth.signingUp": return <T id="auth.signingUp">Signing Up...</T>;
    case "auth.signUp": return <T id="auth.signUp">Sign Up</T>;
    case "auth.forgotPasswordPrompt": return <T id="auth.forgotPasswordPrompt">Forgot your password?</T>;
    case "auth.resetPassword": return <T id="auth.resetPassword">Reset Password</T>;
    case "auth.newPassword": return <T id="auth.newPassword">New Password</T>;
    case "auth.resettingPassword": return <T id="auth.resettingPassword">Resetting Password...</T>;
    case "auth.forgotPassword": return <T id="auth.forgotPassword">Forgot Password?</T>;
    case "auth.sendingResetEmail": return <T id="auth.sendingResetEmail">Sending Reset Email...</T>;
    case "auth.returnToLogin": return <T id="auth.returnToLogin">Return to login page</T>;
    case "battleLogs.description": return <T id="battleLogs.description">Record your PTCG Live battle logs</T>;
    case "battleLogs.header": return <T id="battleLogs.header">PTCG Logs</T>;
    case "common.seeMore": return <T id="common.seeMore">See more</T>;
    case "pocket.games.description": return <T id="pocket.games.description">Log your Pocket matches from home</T>;
    case "pocket.games.pageDescription": return <T id="pocket.games.pageDescription">Record your games from PTCG Pocket</T>;
    case "pocket.games.header": return <T id="pocket.games.header">Pocket Games</T>;
    case "pocket.games.empty": return <T id="pocket.games.empty">No Pocket games yet. Add your first match!</T>;
    case "pocket.tournaments.description": return <T id="pocket.tournaments.description">Record your Pocket tournaments, rounds, and matchups</T>;
    case "pocket.tournaments.header": return <T id="pocket.tournaments.header">Pocket Tournaments</T>;
    case "sidebar.about": return <T id="sidebar.about">About</T>;
    case "sidebar.tcg.battleLogs": return <T id="sidebar.tcg.battleLogs">Battle Logs</T>;
    case "sidebar.tournaments": return <T id="sidebar.tournaments">Tournaments</T>;
    case "sidebar.tcg.stats": return <T id="sidebar.tcg.stats">Stats</T>;
    case "sidebar.pocket.games": return <T id="sidebar.pocket.games">Games</T>;
    case "sidebar.logIn": return <T id="sidebar.logIn">Log In</T>;
    case "sidebar.admin": return <T id="sidebar.admin">Admin</T>;
    case "sidebar.adminStuff": return <T id="sidebar.adminStuff">admin stuff</T>;
    case "sidebar.preferences": return <T id="sidebar.preferences">Preferences</T>;
    case "tournaments.ptcgHeader": return <T id="tournaments.ptcgHeader">PTCG Tournaments</T>;
    case "tournaments.empty.description": return <T id="tournaments.empty.description">You can add tournaments from the past, present, or future.</T>;
    case "tournaments.empty.cta": return <T id="tournaments.empty.cta">Click New Tournament to get started!</T>;
    case "tournaments.description": return <T id="tournaments.description">Record your TCG tournaments, rounds, and matchups</T>;
    case "tournaments.header": return <T id="tournaments.header">Tournaments</T>;
  }

  return <>{children}</>;
}

