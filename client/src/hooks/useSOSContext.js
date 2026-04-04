import { useContext } from "react";
import { SOSContext } from "../context/SOSContext.jsx";

export default function useSOSContext() {
  const context = useContext(SOSContext);

  if (!context) {
    throw new Error("useSOSContext must be used inside SOSProvider");
  }

  return context;
}
