import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { ed25519 } from '@noble/curves/ed25519';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js'
import { Buffer } from 'buffer';
import { Transaction } from '@solana/web3.js';


window.Buffer = Buffer;


function Swap() {
    const [sellAmount, setSellAmount] = useState('')
    const [buyAmount, setBuyAmount] = useState('')
    const [polling, setPolling] = useState(false); // Track polling status
    const { publicKey, signMessage } = useWallet();
    const { connection } = useConnection();
    const wallet = useWallet();
    const [quoteResponse, setQuoteResponse] = useState(null)
    const [isSwapping, setIsSwapping] = useState(false);

    // Function to fetch buy amount from the API
    const fetchBuyAmount = async () => {
        if (!sellAmount || sellAmount <= 0) {
            setBuyAmount('');
            return;
        }

        try {
            const amountToSol = sellAmount * 1000000000; // Convert to appropriate scale
            const response = await axios.get(`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112\
&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\
&amount=${amountToSol}\
&slippageBps=50`)
            setQuoteResponse(response.data);
            setBuyAmount(response.data.outAmount / 1000000)

        } catch (error) {
            console.error('Error fetching buy amount:', error.message);
            setBuyAmount(''); // Reset on error
        }
    }


    async function onSwap() {
        ;
        if (!quoteResponse) {
            console.error('No quote available for swapping');
            return;
        }

        setIsSwapping(true);

        try {
            const response2 = await axios.post('https://quote-api.jup.ag/v6/swap', {
                quoteResponse,
                userPublicKey: publicKey.toString()
            })
            const swapTransaction = response2.data.swapTransaction;
            console.log(swapTransaction)


            const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
            var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            console.log(transaction);

            const tnx = await wallet.sendTransaction(transaction, connection);

            setIsSwapping(false);
            setSellAmount('');
            setBuyAmount('');
            setQuoteResponse(null);

        }
        catch (error) {
            console.error('Error during swap:', error.message);
            if (error.message.includes('User rejected the request')) {
                console.error('Transaction rejected by user');
            }
        } finally {
            setIsSwapping(false); // Set swapping state to false
        }
    }

    // Trigger API call when sellAmount changes and start polling
    useEffect(() => {
        if (sellAmount && sellAmount > 0) {
            fetchBuyAmount();
            setPolling(true); // Start polling
        } else {
            setPolling(false); // Stop polling
        }
    }, [sellAmount]);

    // Polling logic to refresh data every 10 seconds
    useEffect(() => {
        let intervalId;
        if (polling) {
            intervalId = setInterval(() => {
                fetchBuyAmount(); // Fetch updated amount
            }, 1000000); // Poll every 10 seconds
        }

        return () => {
            if (intervalId) clearInterval(intervalId); // Clear interval on unmount
        };
    }, [polling]);

    // Handle sellAmount change
    const handleSellAmountChange = (e) => {
        const value = e.target.value;
        setSellAmount(value);

        // Clear buyAmount if sellAmount is cleared or invalid
        if (!value || value <= 0) {
            setBuyAmount('');
        }
    };

    return (
        <div className="w-full max-w-[400px] space-y-6 p-4">
            {/* Heading */}
            <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                    Swap anytime, anywhere.
                </h1>
            </div>

            {/* Swap Card */}
            <div className="bg-[#1a1b1f] rounded-xl p-4 space-y-4">
                {/* Sell Section */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400">Sell</label>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-[#2c2d33]">
                        <input
                            type="number"
                            placeholder="0"
                            value={sellAmount}
                            onChange={handleSellAmountChange}
                            className="bg-transparent text-xl text-white outline-none flex-1 min-w-0"
                        />
                        <button className="flex items-center gap-2 bg-[#2c2d33] hover:bg-[#3a3b41] px-3 py-2 rounded-lg transition-colors">
                            <span className="text-white text-sm">SOL</span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Swap Direction Arrow */}
                <div className="flex justify-center">
                    <div className="p-2 rounded-full bg-[#2c2d33] hover:bg-[#3a3b41] cursor-pointer transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                        </svg>
                    </div>
                </div>

                {/* Buy Section */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400">Buy</label>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-[#2c2d33]">
                        <input
                            type="number"
                            placeholder="0"
                            value={buyAmount}
                            readOnly
                            className="bg-transparent text-xl text-white outline-none flex-1 min-w-0"
                        />
                        <button className="flex items-center gap-2 bg-[#2c2d33] hover:bg-[#3a3b41] px-3 py-2 rounded-lg transition-colors">
                            <span className="text-white text-sm">USDC</span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Swap Button */}
                <button onClick={onSwap}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-base font-medium transition-colors"
                    disabled={isSwapping} // Disable button while swapping
                >
                    {isSwapping ? 'Swapping...' : 'Swap'}
                </button>
            </div>

            {/* Footer Text */}
            <p className="text-center text-gray-500 text-xs">
                Built and Designed by Sunil
            </p>
        </div>
    );
}

export default Swap;
