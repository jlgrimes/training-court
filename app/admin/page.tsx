import { fetchAvatarImages } from "@/components/avatar/avatar.server.utils";
import { AdminPageClient } from "./AdminPageClient";

export default function AdminPage() {
  // Filesystem read (no auth) — runs at build/request time on the server
  const allAvatarImages = fetchAvatarImages();

  return <AdminPageClient allAvatarImages={allAvatarImages} />;
}
