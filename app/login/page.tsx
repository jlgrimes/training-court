import { LoginPageClient } from "./LoginPageClient";

export default function Login({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  return <LoginPageClient initialMessage={searchParams?.message} />;
}
