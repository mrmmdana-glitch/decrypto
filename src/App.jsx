import { useState } from "react";
import EntryScreen from "./components/EntryScreen";
import AnalyseScreen from "./components/AnalyseScreen";
import WalletDashboard from "./components/wallet/WalletDashboard";
import NetworkScanDashboard from "./components/network/NetworkScanDashboard";
import "./index.css";

export default function App() {
  const [mode, setMode] = useState("entry");
  const [walletAddress, setWalletAddress] = useState("");

  const handleAnalyseWallet = (address) => {
    setWalletAddress(address);
    setMode("wallet");
  };

  const handleScanNetwork = () => setMode("network");
  const handleBack = () => { setMode("entry"); setWalletAddress(""); };

  if (mode === "analyse") return <AnalyseScreen onAnalyse={handleAnalyseWallet} onBack={() => setMode("entry")} />;
  if (mode === "wallet")  return <WalletDashboard address={walletAddress} onBack={handleBack} onScanNetwork={handleScanNetwork} />;
  if (mode === "network") return <NetworkScanDashboard onBack={handleBack} onAnalyseWallet={handleAnalyseWallet} />;
  return <EntryScreen onAnalyseWallet={() => setMode("analyse")} onScanNetwork={handleScanNetwork} />;
}
