/*
 * We are going to be using the useEffect hook!
 */
import { FaRegHeart,FaHeart } from 'react-icons/fa';
import kp from './keypair.json'
import idl from './idl.json';
import { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import ReactHtmlParser from 'react-html-parser'; 
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider,BN, web3, 
  } from '@project-serum/anchor';
import { IconContext } from "react-icons";

// Change this up to be your Twitter if you want.
const TWITTER_HANDLE = 'wrongholt';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devent.
const network = clusterApiUrl('devnet');

// Control's how we want to acknowledge when a trasnaction is "done".
const opts = {
  preflightCommitment: "processed"
}
const App = () => {
  // State
const [walletAddress, setWalletAddress] = useState(null);
const [inputValue, setInputValue] = useState('');
const [loveAmount, setLoveAmount] = useState('');
const [gifList, setGifList] = useState([]);
const TEST_GIFS = ["https://media.giphy.com/media/kkYbDLFmNvO4E/giphy.gif","https://media.giphy.com/media/rj12FejFUysTK/giphy.gif","https://media.giphy.com/media/eenzqB2MsGKbK/giphy.gif","https://media.giphy.com/media/d3yvDeQ9fES0JTfG/giphy.gif"];
  /*
   * This function holds the logic for deciding if a Phantom Wallet is
   * connected or not
   */
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );

          /*
           * Set the user's publicKey in state to be used later!
           */
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };
const getProvider = () => {
  const connection = new Connection(network, opts.preflightCommitment);
  const provider = new Provider(
    connection, window.solana, opts.preflightCommitment,
  );
	return provider;
}
  const connectWallet = async () => {
  const { solana } = window;

  if (solana) {
    const response = await solana.connect();
    console.log('Connected with Public Key:', response.publicKey.toString());
    setWalletAddress(response.publicKey.toString());
  }
};
const createGifAccount = async () => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    console.log("ping")
    await program.rpc.startStuffOff({
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [baseAccount]
    });
    console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
    await getGifList();

  } catch(error) {
    console.log("Error creating BaseAccount account:", error)
  }
}
const onInputChange = (event) => {
  const { value } = event.target;
  setInputValue(value);
};
const sendGif = async () => {
  if (inputValue.length === 0) {
    console.log("No gif link given!")
    return
  }
  console.log('Gif link:', inputValue);
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);

    await program.rpc.addGif(inputValue, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        
      },
    });
    console.log("GIF sucesfully sent to program", inputValue)
    setInputValue("")
    await getGifList();
  } catch (error) {
    console.log("Error sending GIF:", error)
  }
};
const sendLove = async(index)=>{
console.log("LOVE");

const provider = getProvider();
    const program = new Program(idl, programID, provider);
    await program.rpc.updateItem(new BN(index), {
      accounts: {
        baseAccount: baseAccount.publicKey,
        
      },
    });
    // var love = program.gifList[index].totalLove;
    // console.log(love);

};
const tipGifee = async (owner)=>{
try{
  const provider = getProvider();
  const program = new Program(idl, programID, provider);
  await program.rpc.sendSol(new BN(0.5), {
      accounts: {
        baseAccount: baseAccount.publicKey,
        from: provider.wallet.publicKey,
        to:owner,
        systemProgram: SystemProgram.programId,
      },
    });
} catch (error) {
    console.log("Error sending TIP:", error)
  }
};
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );
const renderConnectedContainer = () => {
	// If we hit this, it means the program account hasn't be initialized.
  if (gifList === null) {
    return (
      <div className="connected-container">
        <button className="cta-button submit-gif-button" onClick={createGifAccount}>
          Do One-Time Initialization For GIF Program Account
        </button>
      </div>
    )
  } 
	// Otherwise, we're good! Account exists. User can submit GIFs.
	else {
    return(
      <div className="connected-container">
        <input
          type="text"
          placeholder="Enter gif link!"
          value={inputValue}
          onChange={onInputChange}
        />
        <button className="cta-button submit-gif-button" onClick={sendGif}>
          Submit
        </button>
        <div className="gif-grid">
					{/* We use index as the key instead, also, the src is now item.gifLink */}
          {gifList.map((item, i) => (
            <div className="gif-item" key={i}>
            
              <img src={item.gifLink} />
              <div className="heart-box">
                <IconContext.Provider value={{ color: "red", className: "heart heart-empty" }}>
                <div>
                <FaRegHeart />
                </div>
              </IconContext.Provider>
              <IconContext.Provider value={{ color: "red", className: "heart heart-full" }}>
                <div onClick={() => sendLove(i)}>
                <FaHeart />
                </div>
              </IconContext.Provider>
              </div>
              <div>
              <h3 className="userAddress">{ReactHtmlParser(item.userAddress)}</h3>
              {item.votes && <h3 className="loves">
              <FaHeart /> {item.votes.toString()} Loves <FaHeart />
              </h3>}
              </div>
              <button
      className="cta-button"
      onClick={() => tipGifee(item.userAddress)}
    >
      Tip the GIFee
    </button>
            </div>
          ))}
        </div>
      </div>
    )
  }
}
  /*
   * When our component first mounts, let's check to see if we have a connected
   * Phantom Wallet
   */
  useEffect(() => {
    window.addEventListener('load', async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);
const getGifList = async() => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    
    console.log("Got the account", account)
    setGifList(account.gifList)

  } catch (error) {
    console.log("Error in getGifs: ", error)
    setGifList(null);
  }
}

useEffect(() => {
  if (walletAddress) {
    console.log('Fetching GIF list...');
    getGifList()
  }
}, [walletAddress]);
 return (
    <div className="App">
			{/* This was solely added for some styling fanciness */}
			<div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">ⒶMarvel GIF Portal⊗</p>
          <p className="sub-text">
            View the Marvel GIF collection in the metaverse ✨
          </p>
          {/* Add the condition to show this only if we don't have a wallet address */}
          {!walletAddress && renderNotConnectedContainer()}
        {/* We just need to add the inverse here! */}
        {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;