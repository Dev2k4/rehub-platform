"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Toaster as Sonner,
  type ToasterProps,
  toast as sonnerToast,
} from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      visibleToasts={1}
      icons={{
        success: (
          <CircleCheckIcon
            style={{ width: 18, height: 18, color: "#34d399" }}
          />
        ),
        info: <InfoIcon style={{ width: 18, height: 18, color: "#60a5fa" }} />,
        warning: (
          <TriangleAlertIcon
            style={{ width: 18, height: 18, color: "#fbbf24" }}
          />
        ),
        error: (
          <OctagonXIcon style={{ width: 18, height: 18, color: "#fb7185" }} />
        ),
        loading: (
          <Loader2Icon
            style={{ width: 18, height: 18, color: "#94a3b8" }}
            className="animate-spin"
          />
        ),
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#1e293b",
          "--muted-text": "#64748b",
          "--normal-border": "#e2e8f0",
          "--border-radius": "12px",
          "--success-bg": "#f0fdf4",
          "--success-text": "#166534",
          "--success-border": "#bbf7d0",
          "--error-bg": "#fef2f2",
          "--error-text": "#991b1b",
          "--error-border": "#fecaca",
          "--info-bg": "#eff6ff",
          "--info-text": "#1e40af",
          "--info-border": "#bfdbfe",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          border: "1px solid var(--normal-border)",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
          padding: "1rem 1.25rem",
          fontWeight: 500,
          color: "var(--normal-text)",
        },
      }}
      {...props}
    />
  );
};

// Wrapper to keep compatibility with existing `toaster.create()` calls across the app
export const toaster = {
  create: (options: {
    title?: string;
    description?: string;
    type?: "success" | "error" | "info" | "warning" | "loading";
  }) => {
    const { title, description, type = "info" } = options;
    const message = title || "";
    const toastOpts = description ? { description } : undefined;

    switch (type) {
      case "success":
        return sonnerToast.success(message, toastOpts);
      case "error":
        return sonnerToast.error(message, toastOpts);
      case "warning":
        return sonnerToast.warning(message, toastOpts);
      case "loading":
        return sonnerToast.loading(message, toastOpts);
      case "info":
      default:
        return sonnerToast.info(message, toastOpts);
    }
  },
};

export { Toaster };
