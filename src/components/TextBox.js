import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { doc, getDoc, setDoc, query, where, getDocs, collection } from "firebase/firestore";
import { db } from '../firebase/firebase-config';
import { request } from 'graphql-request';
import './TextBox.css';
import { getDoc, query, where } from 'firebase/firestore';

const TextBox = ({ walletConnectionRef, customText, setCustomText, selectedDinosaur, setSelectedDinosaur, currentHeadAttribute, setCurrentHeadAttribute }) => {
    const [nfts, setNfts] = useState([]);
    const textBoxRef = useRef(null);
    const { connected, account } = useWallet();
    const [pairs, setPairs] = useState([]);
    const [headValuesSet, setHeadValuesSet] = useState(new Set());

    const collectionId = "0x13049480ae8f39cb21c9a0ee8805f248ed8d12d4d70da29daf324e21a3ffe97b";

    // Wrap headValues in useMemo hook
    const headValues = useMemo(() => ["peker", "alladin", "wapal", "loyal hiker", "mo"], []);

    const fetchPairs = async () => {
        try {
            const pairsRef = collection(db, "pairs");
            const pairsSnapshot = await getDocs(pairsRef);
            const pairsArray = pairsSnapshot.docs.map(doc => [doc.data().headValue, doc.data().dinosaur]);
            const pairsSet = new Set(pairsArray.map(pair => pair[0]));
            setPairs(pairsArray);
            setHeadValuesSet(pairsSet);
        } catch (error) {
            console.error('Error fetching pairs:', error);
        }
    };

    useEffect(() => {
        fetchPairs();
    }, []);

    const savePairToFile = useCallback(async (headValue, dinosaur, customTextInput = "") => {
        const newPair = { headValue, dinosaur, customTextInput };
        const updatedPairs = pairs.filter(pair => pair[0] !== headValue).concat([newPair]);
        setPairs(updatedPairs);
        setHeadValuesSet(new Set(updatedPairs.map(pair => pair.headValue)));

        try {
            await setDoc(doc(db, "pairs", headValue), newPair);
            setCustomText(`Got it, ${headValue} will have ${dinosaur} as its aptosaur`);
        } catch (err) {
            console.error('Error writing to pairs file:', err);
        }
    }, [pairs, setCustomText]);

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
        }
    }, [connected, account, collectionId]);

    useEffect(() => {
        if (!connected) {
            setCustomText("Hello homosapien, if you happen to have a 1/1 caveman you may select an aptosaur of your liking");

            setTimeout(() => {
                setCustomText("Connect your wallet to check");
            }, 2500);
        } else {
            fetchNfts();
        }
    }, [connected, account, fetchNfts, setCustomText]);

    useEffect(() => {
        if (connected) {
            const matchingNfts = nfts.filter((nft) => {
                const headAttribute = nft.metadata?.attributes?.find(attribute => attribute.trait_type === 'head');
                return headAttribute && headValues.includes(headAttribute.value.toLowerCase());
            });

            if (matchingNfts.length > 0) {
                const headValue = matchingNfts[0].metadata?.attributes?.find(attribute => attribute.trait_type === 'head').value;
                setCurrentHeadAttribute(headValue);

                setCustomText(`I see you have the ${headValue} caveman available`);

                setTimeout(() => {
                    setCustomText(`Which aptosaur would you like for your 1/1?`);
                }, 2500);
            } else {
                setCurrentHeadAttribute(null); // No head value available
                setCustomText("Opps you don't seem to own a 1/1 caveman");

                setTimeout(() => {
                    setCustomText("There are still a few caveman, give your luck a try, mint some at <a href='https://wapal.com'>wapal</a>");
                }, 2500);
            }
        }

        const handleClick = (event) => {
            if (walletConnectionRef && walletConnectionRef.current && !walletConnectionRef.current.contains(event.target) && !connected) {
                setCustomText("The connect button is on the TOP RIGHT... and I thought I don't know how to read");
                textBoxRef.current.classList.add('show');
            }
        };

        document.addEventListener('click', handleClick);

        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, [connected, nfts, walletConnectionRef, setCustomText, headValuesSet, setCurrentHeadAttribute, headValues]);

    useEffect(() => {
        if (currentHeadAttribute) {
            setCustomText(`I see you have the ${currentHeadAttribute} caveman available`);
        }
    }, [currentHeadAttribute, setCustomText]);

    const handleYesSpecialRequest = useCallback(() => {
        setCustomText(`
            <div class="special-request-container">
                <input type="text" id="specialRequestInput" maxlength="200" placeholder="Enter your special request here..." />
                <button id="submitSpecialRequest">Submit</button>
            </div>
        `);

        setTimeout(() => {
            const submitSpecialRequest = document.getElementById('submitSpecialRequest');
            if (submitSpecialRequest) {
                submitSpecialRequest.onclick = () => {
                    const specialRequestInput = document.getElementById('specialRequestInput').value;
                    savePairToFile(currentHeadAttribute, selectedDinosaur, specialRequestInput);
                    setCustomText(`Got it, ${currentHeadAttribute} will have ${selectedDinosaur} as its aptosaur`);

                    setTimeout(() => {
                        setCustomText(`I see you have the ${currentHeadAttribute} caveman available`);

                        setTimeout(() => {
                            setCustomText(`Which aptosaur would you like for your 1/1?`);
                        }, 2500);
                    }, 2500);
                };
            }
        }, 0);
    }, [currentHeadAttribute, savePairToFile, selectedDinosaur, setCustomText]);

    const handleNoSpecialRequest = useCallback(() => {
        savePairToFile(currentHeadAttribute, selectedDinosaur, "none");
        setCustomText(`Got it, ${currentHeadAttribute} will have ${selectedDinosaur} as its aptosaur with no special request`);

        setTimeout(() => {
            setCustomText(`I see you have the ${currentHeadAttribute} caveman available`);

            setTimeout(() => {
                setCustomText(`Which aptosaur would you like for your 1/1?`);
            }, 2500);
        }, 2500);
    }, [currentHeadAttribute, savePairToFile, selectedDinosaur, setCustomText]);

    const handleYesClick = useCallback(() => {
        setCustomText(`Is there any special request for your 1/1 aptosaur art? <span class="clickable" id="yesSpecialRequest">YES</span> or <span class="clickable" id="noSpecialRequest">NO</span>?`);

        setTimeout(() => {
            const yesSpecialRequest = document.getElementById('yesSpecialRequest');
            const noSpecialRequest = document.getElementById('noSpecialRequest');

            if (yesSpecialRequest) {
                yesSpecialRequest.onclick = handleYesSpecialRequest;
            }

            if (noSpecialRequest) {
                noSpecialRequest.onclick = handleNoSpecialRequest;
            }
        }, 0);
    }, [handleYesSpecialRequest, handleNoSpecialRequest, setCustomText]);

    const handleNoClick = useCallback(() => {
        setCustomText("Alrighty.");

        setTimeout(() => {
            setCustomText(`I see you have the ${currentHeadAttribute} caveman available`);

            setTimeout(() => {
                setCustomText(`Which aptosaur would you like for your 1/1?`);
            }, 2500);
        }, 2500);
    }, [currentHeadAttribute, setCustomText]);

    useEffect(() => {
        const yesButton = document.getElementById('yesButton');
        const noButton = document.getElementById('noButton');

        if (yesButton) {
            yesButton.onclick = handleYesClick;
        }

        if (noButton) {
            noButton.onclick = handleNoClick;
        }
    }, [customText, handleYesClick, handleNoClick]);

    const handleDinosaurClick = (dinosaur) => {
        if (currentHeadAttribute) {
            setSelectedDinosaur(dinosaur);

            // Check if the current headValue already has a dinosaur pair
            const existingPair = pairs.find(pair => pair[0] === currentHeadAttribute);

            if (existingPair) {
                setCustomText(`This ${currentHeadAttribute} already has an aptosaur. Do you want to select ${dinosaur} as the Aptosaur for ${currentHeadAttribute}? <span class="clickable" id="yesButton">YES</span> or <span class="clickable" id="noButton">NO</span>?`);
            } else {
                setCustomText(`Do you want ${dinosaur} for your caveman? <span class="clickable" id="yesButton">YES</span> or <span class="clickable" id="noButton">NO</span>?`);
            }
        } else {
            setCustomText("Opps you don't seem to own a 1/1 caveman");

            setTimeout(() => {
                setCustomText("There are still a few caveman, give your luck a try, mint some at <a href='https://wapal.com'>wapal</a>");
            }, 2500);

            setTimeout(() => {
                setCustomText("I'm sorry, you don't seem to own a caveman");
            }, 5000);

            setTimeout(() => {
                setCustomText("There are still a few caveman, give your luck a try, mint some at <a href='https://wapal.com'>wapal</a>");
            }, 7500);
        }
    };

    return (
        <>
            <div className="text-box" ref={textBoxRef}>
                <p>
                    {customText.includes("Do you want to change it?") ? (
                        <>
                            {customText.split("Do you want to change it?")[0]}
                            Do you want to select <strong>{selectedDinosaur}</strong> as the Aptosaur for <strong>{currentHeadAttribute}</strong>? <span class="clickable" id="yesButton">YES</span> or <span class="clickable" id="noButton">NO</span>?
                        </>
                    ) : (
                        <span dangerouslySetInnerHTML={{ __html: customText }} />
                    )}
                </p>
            </div>
            <div className="button-row">
                <button className="rectangle-button button1" data-text="SPINOSAUR" onClick={() => handleDinosaurClick("SPINOSAUR")}></button>
                <button className="rectangle-button button2" data-text="STEGOSAUR" onClick={() => handleDinosaurClick("STEGOSAUR")}></button>
                <button className="rectangle-button button3" data-text="TRICERATOP" onClick={() => handleDinosaurClick("TRICERATOP")}></button>
                <button className="rectangle-button button4" data-text="T-REX" onClick={() => handleDinosaurClick("T-REX")}></button>
                <button className="rectangle-button button5" data-text="BRONCHIOSAUR" onClick={() => handleDinosaurClick("BRONCHIOSAUR")}></button>
            </div>
        </>
    );
};

export default TextBox;
