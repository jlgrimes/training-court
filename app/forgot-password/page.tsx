import { ForgotPasswordClient } from "./ForgotPasswordClient";

export default function ForgotPassword({ searchParams }: { searchParams: { message?: string } }) {
  return <ForgotPasswordClient initialMessage={searchParams?.message} />;
}
