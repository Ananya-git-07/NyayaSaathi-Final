import { useState } from "react";

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    onConfirm: () => {},
  });

  const confirm = ({ title, message, type = "warning" }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        type,
        onConfirm: () => {
          resolve(true);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        },
      });
    });
  };

  const closeDialog = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  return { confirmState, confirm, closeDialog };
};
