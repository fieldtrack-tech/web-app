"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="flex items-start gap-2.5">
            {props.variant === "destructive" ? (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-error" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-success-green" />
            )}
            <div className="grid gap-0.5">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? <ToastDescription>{description}</ToastDescription> : null}
            </div>
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
