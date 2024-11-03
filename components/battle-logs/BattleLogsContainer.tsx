import { fetchCurrentUser } from "../auth.utils";
import { BattleLogsContainerClient } from "./BattleLogsContainerClient";
import { fetchUserData } from "../user-data.utils";


export async function BattleLogsContainer () {
  const user = await fetchCurrentUser();

  // TODO: Update these to return something useful
  if (!user) return null;

  let userData = await fetchUserData(user.id);

  return (
    <BattleLogsContainerClient userData={userData} />
  )
}