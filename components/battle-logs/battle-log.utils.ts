function trimBattleLog(log: string): string[] {
  return log.split('\n').reduce((acc: string[], curr: string) => {
    if (curr.length === 0 || curr === '\n') return acc;
    return [...acc, curr];
  }, []);
}

export function getPlayerNames(log: string[]): string[] {
  const playerNames = log.reduce((acc: string[], curr: string) => {
    if (!curr.toLowerCase().includes(`'s turn`)) return acc;
    if (acc.some((player) => curr.includes(player))) return acc;

    const name = /- (.*)'s Turn/g.exec(curr)?.[1];

    if (!name) throw Error('Name not found in correct log line');

    return [...acc, name]
  }, []);

  if (playerNames.length !== 2) throw Error('Error: not two players found in battle log.');

  return playerNames;
}

export function determineWinner(log: string[]): string {
  for (const line of log) {
    const winner = /\. (.*) wins\./g.exec(line)?.[1];
    if (winner) return winner;
  }

  throw 'No winner found';
}

export function parseBattleLog(log: string) {
  const cleanedLog = trimBattleLog(log);
  const playerNames = getPlayerNames(cleanedLog);

  // const battleLog: BattleLog = {

  // }

  console.log(playerNames);
}