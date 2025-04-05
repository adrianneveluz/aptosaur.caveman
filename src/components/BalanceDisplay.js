import React, { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AptosClient } from 'aptos';

const APTOS_NODE_URL = 'https://fullnode.mainnet.aptoslabs.com';

const BalanceDisplay = () => {
    const [balance, setBalance] = useState(null);
    const { connected, account } = useWallet();

    useEffect(() => {
        const fetchBalance = async () => {
            if (connected && account) {
                console.log("Connected to wallet:", account.address);
                const aptosClient = new AptosClient(APTOS_NODE_URL);

                try {
                    const resources = await aptosClient.getAccountResources(account.address);
                    console.log("Resources fetched:", JSON.stringify(resources, null, 2)); // Log full resources

                    const tokenType = '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'; // Confirm the token type for Aptos V2
                    const tokenResource = resources.find(resource => resource.type === tokenType);

                    if (tokenResource) {
                        const rawBalance = tokenResource.data.coin.value; // Fetch the raw balance
                        const formattedBalance = (parseInt(rawBalance) / 1e8).toFixed(8); // Convert to decimal format
                        console.log("Token balance:", formattedBalance);
                        setBalance(formattedBalance); // Update balance state with formatted value
                    } else {
                        console.log("Token resource not found for address:", account.address);
                        setBalance(0);
                    }
                } catch (error) {
                    console.error('Failed to fetch token balance:', error);
                    setBalance('Error fetching balance');
                }
            } else {
                console.log("Wallet not connected or account is null.");
                setBalance(null);
            }
        };

        fetchBalance();
    }, [connected, account]);

    return (
        <div className="balance-box">
            <p>APT balance: {balance !== null ? `${balance} APT` : 'Loading...'}</p>
        </div>
    );
};

export default BalanceDisplay;
