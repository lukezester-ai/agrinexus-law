"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";

type State =
	| { status: "loading" }
	| { status: "unconfigured" }
	| { status: "anonymous" }
	| { status: "signed_in"; user: User };

export function useAuthUser(): State {
	const [state, setState] = useState<State>(() =>
		isSupabaseAuthConfigured() ? { status: "loading" } : { status: "unconfigured" },
	);

	useEffect(() => {
		const supabase = createBrowserSupabaseClient();
		if (!supabase) {
			setState({ status: "unconfigured" });
			return;
		}

		let cancelled = false;

		void supabase.auth.getUser().then(({ data: { user } }) => {
			if (cancelled) return;
			setState(
				user ? { status: "signed_in", user } : { status: "anonymous" },
			);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (cancelled) return;
			const user = session?.user ?? null;
			setState(
				user ? { status: "signed_in", user } : { status: "anonymous" },
			);
		});

		return () => {
			cancelled = true;
			subscription.unsubscribe();
		};
	}, []);

	return state;
}
