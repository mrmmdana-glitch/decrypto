import { useState } from "react";
import EntryScreen from "./components/EntryScreen";
import { CockpitDashboard } from "./components/wallet/cockpit";
import "./index.css";

export default function App() {
  const [mode, setMode] = useState("entry");
  const [walletAddress, setWalletAddress] = useState("");

  const handleAnalyseWallet = (address) => {
    setWalletAddress(address);
    setMode("wallet");
  };

  const handleOpenWalletWorkspace = () => {
    setMode("wallet");
  };

  const handleClearWallet = () => {
    setWalletAddress("");
  };

  const handleBack = () => {
    setMode("entry");
  };

  if (mode === "wallet") {
    return (
      <CockpitDashboard
        address={walletAddress}
        onAnalyse={handleAnalyseWallet}
        onClear={handleClearWallet}
        onBack={handleBack}
      />
    );
  }

  return <EntryScreen onAnalyseWallet={handleOpenWalletWorkspace} />;
}
