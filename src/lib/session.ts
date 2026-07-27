import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type SessionState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ session: null, user: null, loading: true });

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setState({ session, user: session?.user ?? null, loading: false });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState({ session: data.session, user: data.session?.user ?? null, loading: false });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signOut() {
  await supabase.auth.signOut();
}