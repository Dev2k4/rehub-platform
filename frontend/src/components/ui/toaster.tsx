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
          "--normal-bg": "rgba(15, 23, 42, 0.88)",
          "--normal-text": "#ffffff",
          "--muted-text": "rgba(255, 255, 255, 0.9)",
          "--normal-border": "rgba(255, 255, 255, 0.15)",
          "--border-radius": "14px",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 20px 50px -15px rgba(0,0,0,0.5)",
          padding: "1rem 1.25rem",
          fontWeight: 500,
          color: "#ffffff",
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
