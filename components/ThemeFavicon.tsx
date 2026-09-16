"use client";

import { useEffect } from "react";

export default function ThemeFavicon() {
  useEffect(() => {
    const matcher = window.matchMedia("(prefers-color-scheme: dark)");

    const updateFavicon = (isDark: boolean) => {
      const iconPath = isDark ? "/logo2.png" : "/logo.png";
      const existingIcons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
      if (existingIcons.length > 0) {
        existingIcons.forEach((link) => {
          link.href = iconPath;
        });
      } else {
        const newLink = document.createElement("link");
        newLink.rel = "icon";
        newLink.href = iconPath;
        document.head.appendChild(newLink);
      }
    };

    updateFavicon(matcher.matches);

    const handler = (e: MediaQueryListEvent) => {
      updateFavicon(e.matches);
    };

    matcher.addEventListener("change", handler);
    return () => matcher.removeEventListener("change", handler);
  }, []);

  return null;
}
