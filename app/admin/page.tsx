import { redirect } from "next/navigation";
import { fetchCurrentUser } from "@/components/auth.utils";
import { isUserAnAdmin } from "@/components/admin/admin.utils";

export default async function AdminPage() {
  const user = await fetchCurrentUser();

  if (!user || !isUserAnAdmin(user)) {
    return redirect("/");
  }

  return (
    <div className="flex flex-col py-4 lg:py-8 px-8 lg:px-16 gap-4 w-full h-full">
      <h1>Welcome admin!</h1>
      
    </div>
  );
}
