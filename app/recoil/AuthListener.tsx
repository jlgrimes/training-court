// 'use client';

// import { useEffect } from 'react';
// import { useSetRecoilState } from 'recoil';
// import {
//   userAtom,
//   userProfileAtom,
//   sessionAtom,
//   isAuthenticatedAtom,
//   authLoadingAtom,
// } from '@/app/recoil/atoms/user';
// import { createClient } from '@/utils/supabase/client';

// export function AuthListener() {
//   const setUser = useSetRecoilState(userAtom);
//   const setProfile = useSetRecoilState(userProfileAtom);
//   const setSession = useSetRecoilState(sessionAtom);
//   const setAuthed = useSetRecoilState(isAuthenticatedAtom);
//   const setLoading = useSetRecoilState(authLoadingAtom);

//   useEffect(() => {
//     const supabase = createClient();
//     let alive = true;

//     // 1) Initial fetch on load
//     (async () => {
//       setLoading(true);
//       const [{ data: { user } }, { data: { session } }] = await Promise.all([
//         supabase.auth.getUser(),
//         supabase.auth.getSession(),
//       ]);
//       if (!alive) return;

//       setUser(user ?? null);
//       setAuthed(!!user);
//       setSession(session?.access_token ?? null);
//       if (!user) setProfile(null);

//       setLoading(false);
//     })();

//     // 2) Live auth updates (login, refresh, logout)
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         const user = session?.user ?? null;

//         if (event === 'SIGNED_OUT') {
//           setUser(null);
//           setProfile(null);
//           setSession(null);
//           setAuthed(false);
//           return;
//         }

//         setUser(user ?? null);
//         setAuthed(!!user);
//         setSession(session?.access_token ?? null);

//         if (!user) setProfile(null);
//         // Set user on login / logout
//         if (user) {
//           const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
//           setProfile(data ?? null);
//         }
//       }
//     );

//     return () => {
//       alive = false;
//       subscription.unsubscribe();
//     };
//   }, [setUser, setProfile, setSession, setAuthed, setLoading]);

//   return null;
// }
