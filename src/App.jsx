import './App.css'
import React, { useState } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  WalletDisconnectButton,
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';
import Swap from './components/Swap';

function App() {


  const endpoint = 'https://api.mainnet-beta.solana.com';
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="flex justify-between w-full max-w-4xl p-4">
              <WalletMultiButton />
              <WalletDisconnectButton />
            </div>
            <Swap />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}



export default App
