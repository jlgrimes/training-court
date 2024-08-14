import { Button } from "@/components/ui/button";

export default function UserGames() {
  return (
    <div className="flex-1 flex flex-col w-full h-full px-8 py-16 sm:max-w-lg justify-between gap-2">
      <h1 className="scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">My games</h1>
      <Button>Add new game</Button>
    </div>
  );
}
