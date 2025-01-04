import { useEffect } from "react";

interface KeyboardShortcutsProps {
  onPrint: () => void;
  onSearch: () => void;
  onRefresh: () => void;
  onNew: () => void;
  onDelete: () => void;
  locale: string;
}

export const KeyboardShortcuts = ({
  onPrint,
  onSearch,
  onRefresh,
  onNew,
  onDelete,
  locale,
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && !event.altKey && (event.key === "p" || event.key === "ح")) {
        event.preventDefault();
        onPrint();
      }
      if (event.ctrlKey && (event.key === "f" || event.key === "ب")) {
        event.preventDefault();
        onSearch();
      }
      if (event.key === "F5") {
        event.preventDefault();
        onRefresh();
      }
      if (event.key === "F1") {
        event.preventDefault();
        onNew();
      }
      if (event.key === "Delete") {
        event.preventDefault();
        onDelete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [locale, onPrint, onSearch, onRefresh, onNew, onDelete]);

  return null;
};