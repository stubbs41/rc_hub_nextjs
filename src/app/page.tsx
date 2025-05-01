"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Session } from "@supabase/supabase-js";
import AuthForm from "@/components/AuthForm";
import VehicleList from "@/components/VehicleList";
import PartList from "@/components/PartList"; // Import PartList

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <p>Loading...</p>; // Show a loading indicator
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-12">
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center">
          RC Hub (Next.js Version)
        </h1>
        {!session ? (
          <AuthForm />
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
                <p>Welcome, {session.user.email}</p>
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Sign out
                </button>
            </div>
            {/* Render VehicleList */}
            <VehicleList />
            {/* Render PartList below VehicleList */}
            <PartList />
          </div>
        )}
      </div>
    </main>
  );
}

