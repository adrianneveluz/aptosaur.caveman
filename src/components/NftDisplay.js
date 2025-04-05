import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { request } from 'graphql-request';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import './NftDisplay.css';
import leftIcon from '../imgassets/left.png';
import rightIcon from '../imgassets/right.png';

const NftDisplay = ({ setCurrentHeadAttribute }) => {
  const [nfts, setNfts] = useState([]);
  const [filteredNfts, setFilteredNfts] = useState([]);
  const [currentNftIndex, setCurrentNftIndex] = useState(0);
  const [error, setError] = useState('');
  const { connected, account } = useWallet();

  const collectionId = "0x13049480ae8f39cb21c9a0ee8805f248ed8d12d4d70da29daf324e21a3ffe97b"; // Use the correct collection ID
  const headValues = useMemo(() => ["peker", "alladin", "wapal", "loyal hiker", "mo"], []);

  const fetchNfts = useCallback(async () => {
    if (!connected || !account) {
      return;
    }

    try {
      const query = `
        query GetAccountNfts($address: String, $collectionId: String) {
          current_token_ownerships_v2(
            where: {
              owner_address: {_eq: $address},
              amount: {_gt: "0"},
              current_token_data: {current_collection: {collection_id: {_eq: $collectionId}}}
            }
          ) {
            current_token_data {
              current_collection {
                collection_name
                uri
              }
              description
              token_name
              token_uri
            }
            amount
          }
        }
      `;
      const variables = { address: account.address, collectionId };

      const response = await request(
        'https://api.mainnet.aptoslabs.com/v1/graphql',
        query,
        variables
      );

      const nftData = response?.current_token_ownerships_v2 || [];

      const nftsWithMetadata = await Promise.all(
        nftData.map(async (nft) => {
          try {
            const metadataResponse = await fetch(nft.current_token_data.token_uri);
            const metadata = await metadataResponse.json();
            return { ...nft, metadata };
          } catch (err) {
            console.error('Failed to fetch metadata for:', nft, err);
            return nft;
          }
        })
      );

      setNfts(nftsWithMetadata);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError('Failed to fetch NFTs.');
    }
  }, [connected, account, collectionId]);

  useEffect(() => {
    fetchNfts();
  }, [fetchNfts]);

  useEffect(() => {
    const filteredNfts = nfts.filter(nft => {
      const headAttribute = nft.metadata?.attributes?.find(attribute => attribute.trait_type === 'head');
      return headAttribute && headValues.includes(headAttribute.value.toLowerCase());
    });
    setFilteredNfts(filteredNfts);
  }, [nfts, headValues]);

  useEffect(() => {
    if (connected && filteredNfts.length > 0) {
      const currentNft = filteredNfts[currentNftIndex];
      const headAttribute = currentNft.metadata?.attributes?.find(attribute => attribute.trait_type === 'head');
      if (headAttribute && headValues.includes(headAttribute.value.toLowerCase())) {
        setCurrentHeadAttribute(headAttribute.value);
      }
    }
  }, [currentNftIndex, filteredNfts, connected, headValues, setCurrentHeadAttribute]);

  const handlePrevClick = () => {
    setCurrentNftIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : filteredNfts.length - 1));
  };

  const handleNextClick = () => {
    setCurrentNftIndex((prevIndex) => (prevIndex < filteredNfts.length - 1 ? prevIndex + 1 : 0));
  };

  return (
    <div className="nft-display-wrapper">
      <div className="nft-display">
        {error && <div className="error">{error}</div>}
        <div className="nft-card-container">
          {filteredNfts.length > 0 ? (
            <div className="nft-card">
              <p className="nft-attribute">{filteredNfts[currentNftIndex].metadata?.attributes?.find(attribute => attribute.trait_type === 'head').value}</p>
              <img 
                src={filteredNfts[currentNftIndex].metadata?.image || filteredNfts[currentNftIndex].current_token_data.token_uri} 
                alt={filteredNfts[currentNftIndex].current_token_data.token_name}
                className="nft-image"
              />
              <div className="button-row">
                <button onClick={handlePrevClick} className="nav-button">
                  <img src={leftIcon} alt="Previous" className="button-icon" />
                </button>
                <button onClick={handleNextClick} className="nav-button">
                  <img src={rightIcon} alt="Next" className="button-icon" />
                </button>
              </div>
            </div>
          ) : (
            <p></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NftDisplay;