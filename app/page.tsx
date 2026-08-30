import { PublicOnly } from "@/components/auth/PublicOnly";
import { LandingPageContent } from "@/components/landing/LandingPageContent";

export default function Index() {
  return (
    <PublicOnly to='/home'>
      <LandingPageContent />
    </PublicOnly>
  );
}
