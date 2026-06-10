import { FriendRequestPageClient } from './FriendRequestPageClient';

export default function FriendRequestReceivePage({ params }: { params: { id: string } }) {
  return <FriendRequestPageClient requestId={params.id} />;
}
