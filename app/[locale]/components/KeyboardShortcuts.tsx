import { useEffect } from "react";

interface KeyboardShortcutsProps {
  onPrint: () => void;
  onSearch: () => void;
  onRefresh: () => void;
  onNew: () => void;
  onDelete: () => void;
  locale: string;
  userPermissions: any;
}

export const KeyboardShortcuts = ({
  onPrint,
  onSearch,
  onRefresh,
  onNew,
  onDelete,
  locale,
  userPermissions,
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && !event.altKey && (event.key === "p" || event.key === "ح")) {
        event.preventDefault();
        if (userPermissions.Print === 1) onPrint();
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
        if (userPermissions.Add === 1) onNew();
      }
      if (event.key === "Delete") {
        event.preventDefault();
        if (userPermissions.Remove === 1) onDelete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [locale, onPrint, onSearch, onRefresh, onNew, onDelete]);

  return null;
};
