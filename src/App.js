import React, { useState, useEffect, useRef } from 'react';
import { AptosWalletAdapterProvider, useWallet } from '@aptos-labs/wallet-adapter-react';
import WalletConnection from './components/WalletConnection';
import NftDisplay from './components/NftDisplay';
import TextBox from './components/TextBox';
import './App.css';
import './components/WalletConnection.css';

const wallets = []; // Define your wallets array if necessary

const App = () => {
  const { account } = useWallet();
  const [walletAddress, setWalletAddress] = useState(account?.address || "");
  const walletConnectionRef = useRef(null);
  const [customText, setCustomText] = useState("");
  const [selectedDinosaur, setSelectedDinosaur] = useState("");
  const [currentHeadAttribute, setCurrentHeadAttribute] = useState("");

  useEffect(() => {
    if (account && account.address !== walletAddress) {
      setWalletAddress(account.address);
    }
  }, [account, walletAddress]);

  return (
    <AptosWalletAdapterProvider wallets={wallets}>
      <div className="App">
        <div className="info" ref={walletConnectionRef}>
          <WalletConnection setWalletAddress={setWalletAddress} />
        </div>
        <div className="rectangle-container">
          <div className="rectangle">
            <TextBox 
              walletConnectionRef={walletConnectionRef} 
              customText={customText} 
              setCustomText={setCustomText} 
              selectedDinosaur={selectedDinosaur} 
              setSelectedDinosaur={setSelectedDinosaur} 
              currentHeadAttribute={currentHeadAttribute}
              setCurrentHeadAttribute={setCurrentHeadAttribute}
            />
          </div>
        </div>
        <NftDisplay setCurrentHeadAttribute={setCurrentHeadAttribute} />
        <div className="foreground-gif"></div>
      </div>
    </AptosWalletAdapterProvider>
  );
};

export default App;