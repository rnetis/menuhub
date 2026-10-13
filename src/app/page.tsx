"use client";

import * as React from "react";
import { useApp, parseHash, type Route } from "@/components/app/store";
import Landing from "@/components/app/Landing";
import AuthView from "@/components/app/AuthView";
import Onboarding from "@/components/app/Onboarding";
import Dashboard from "@/components/app/Dashboard";
import PublicMenu from "@/components/app/PublicMenu";
import PlatformAdmin from "@/components/app/PlatformAdmin";

function useHashRoute(): Route {
  const [route, setRoute] = React.useState<Route>(() =>
    typeof window === "undefined" ? { name: "landing" } : parseHash(window.location.hash)
  );

  React.useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      // scroll to top on route change
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

export default function Home() {
  const route = useHashRoute();
  const { refresh, loaded } = useApp();

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // show a brief splash until session status is known
  if (!loaded && route.name !== "menu") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-teal-600/20 border-t-teal-700" />
      </div>
    );
  }

  switch (route.name) {
    case "login":
      return <AuthView mode="login" />;
    case "register":
      return <AuthView mode="register" />;
    case "onboarding":
      return <Onboarding />;
    case "dash":
      return <Dashboard section={route.section} />;
    case "menu": {
      const [hashPath, queryString] = window.location.hash.split("?");
      void hashPath;
      const params = new URLSearchParams(queryString || "");
      return <PublicMenu slug={route.slug} srcParam={params.get("src") || undefined} />;
    }
    case "admin":
      return <PlatformAdmin />;
    default:
      return <Landing />;
  }
}
