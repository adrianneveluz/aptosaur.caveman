import React from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import './WalletConnection.css'; // Import the CSS file

const WalletConnection = ({ setWalletAddress }) => {
    const { connected, account, disconnect } = useWallet();

    // Update wallet address in the parent component when connected
    React.useEffect(() => {
        if (connected && account) {
            setWalletAddress(account.address);
        }
    }, [connected, account, setWalletAddress]);

    return (
        <div className="connect-image-container">
            <div className={`connect-image ${connected ? 'hidden' : ''}`}></div>
            <div className={`disconnect-image ${connected ? '' : 'hidden'}`}></div>
            <div className={`button-box ${connected ? 'connected' : ''}`}>
                {!connected ? (
                    <WalletSelector>
                        <button className="connect-wallet-button">Connect Wallet</button>
                    </WalletSelector>
                ) : (
                    <div>
                        <button className="disconnect" onClick={disconnect}>Disconnect</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletConnection;