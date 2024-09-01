import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Index() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return redirect("/home");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center p-8">
      <h1>Buddy pofin</h1>
      <p>Yay</p>
    </div>
  );
}
