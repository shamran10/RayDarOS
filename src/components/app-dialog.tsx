"use client";

import { useEffect, useId, useRef } from "react";
import type { FormEventHandler, MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";

type AppDialogProps = {
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  testId?: string;
  title: string;
  width?: "large" | "x-large";
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export function AppDialog({
  children,
  footer,
  onClose,
  onSubmit,
  testId = "app-dialog",
  title,
  width = "large"
}: AppDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");

      if (!focusableElements.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  const closeFromOverlay = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return createPortal(
    <div
      className="app-dialog-overlay"
      data-testid={`${testId}--blanket`}
      onMouseDown={closeFromOverlay}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={`app-dialog app-dialog-${width}`}
        data-testid={testId}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="app-dialog-header">
          <h1 id={titleId}>{title}</h1>
        </header>
        <form className="app-dialog-form" onSubmit={onSubmit}>
          <div className="app-dialog-body">{children}</div>
          <footer className="app-dialog-footer">{footer}</footer>
        </form>
      </div>
    </div>,
    document.body
  );
}
