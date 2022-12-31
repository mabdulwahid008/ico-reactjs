import { useEffect, useRef, useState } from 'react';
import './App.css';
import Web3Modal from 'web3modal'
import { BigNumber, Contract, providers, utils } from 'ethers';
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS } from "./constants/index";

function App() {
  const zero = BigNumber.from(0)
  const [wallledConnected, setwallledConnected] = useState(false)
  const web3ModalRef = useRef()
  const [tokenMinted, setTokenMinted] = useState(zero)
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero)
  const [tokenAmount, setTokenAmount] = useState(zero)
  const [tokenToBeClaimed, setTokenToBeClaimed] = useState(zero)
  const [loading, setLoading] = useState(false)

  const getTokenToBeClaimed = async() => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI,
        provider
      )
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress()
      const balance = await nftContract.balanceOf(address)

      if(balance === zero){
        setTokenToBeClaimed(zero)
      } else {
        let amount = 0;
        for(let i = 0; i < balance; i++){
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if(!claimed){
            amount += 1;
          }
        }
        setTokenToBeClaimed(BigNumber.from(amount))
      }
    } catch (error) {
      console.error(error);
      setTokenToBeClaimed(zero)
    }
  }

  const getBalanceOfCryptoDevTokens = async() =>{ 
    try {
      const provider = await getProviderOrSigner();

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )

      const signer = await getProviderOrSigner(true)
      const address = signer.getAddress();

      const balance = await tokenContract.balanceOf(address)
      setBalanceOfCryptoDevTokens(balance)
    } catch (error) {
      console.error(error);
    }
  }

  const getTotalTokenMinted = async() => {
    try {
      const provider = await getProviderOrSigner()

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )
      const _tokenMinted = await tokenContract.totalSupply()
      setTokenMinted(_tokenMinted)
    } catch (error) {
      console.error(error);
    }
  }

  const mintCryptoDevToken = async(amount) => {
    try {
      const signer = await getProviderOrSigner(true);

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      )

      const value = 0.001*amount;
      const tx = await tokenContract.mint(amount, {
        value : utils.parseEther(value.toString())
      })

      setLoading(true);
      await tx.wait();
      setLoading(false);
      
      window.alert('Successfully minted Crypto Dev Tokens')

      await getBalanceOfCryptoDevTokens()
      await getTotalTokenMinted()
      await getTokenToBeClaimed()
    } catch (error) {
      console.error(error);
    }
  }

  const claimCryptoDevToken = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      )

      const tx = await tokenContract.claim();

      setLoading(true)
      await tx.wait();
      setLoading(false)
      window.alert('Successfully claimed tokens')

      
      await getBalanceOfCryptoDevTokens()
      await getTotalTokenMinted()
      await getTokenToBeClaimed()
    } catch (error) {
      console.error(error);
    }
  }

  const renderButton = () => {
    if(loading){
      return (
        <div>
          <button className='button'>Loading...</button>
        </div>
      )
    }
    if(tokenToBeClaimed) {
      return(
        <div>
          <div className='description'>
            {tokenToBeClaimed * 10} Tokens to be claimed!
          </div>
          <button className='button' onClick={claimCryptoDevToken}>Claim Tokens</button>
        </div>
      )
    }
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input  type='number' placeholder='Amount of Token' onChange={(e)=>setTokenAmount(BigNumber.from(e.target.value))}/>
          <button className='button' disabled={!(tokenAmount > 0)} onClick={()=>mintCryptoDevToken(tokenAmount)}>Mint Tokens</button>
        </div>
      </div>
    )
  }

  const getProviderOrSigner = async(needSigner = false) => {
    const provider = await web3ModalRef.current.connect()
    const web3Provider = new providers.Web3Provider(provider)
    
    const  { chainId } = await web3Provider.getNetwork()
    if(chainId !== 5 ){
      window.alert("Change network to goerli");
      throw new Error("Change Network to Goerli")
    }
    if(needSigner){
      const signer = web3Provider.getSigner()
      return signer;
    }
    return web3Provider;
  }

  const connectWallet = async() => {
    try {
      await getProviderOrSigner()
      setwallledConnected(true)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(()=>{
    if(!wallledConnected) {
      web3ModalRef.current = new Web3Modal({
        network : 'goerli',
        providerOptions: {},
        disableInjectedProvider: false
      })
      connectWallet()
      
       getBalanceOfCryptoDevTokens()
       getTotalTokenMinted()
       getTokenToBeClaimed()
    }
  }, [wallledConnected])
  return (
   <>
      <div className='main'>
        <div>
          <h1 className='title'>Welcome to Crypto Dev ICO</h1>
          <div className="description">
              You can claim or mint Crypto Dev Tokens here
          </div>
          {
            wallledConnected ? 
            <div>
              <div className="description">
                  You've minted {utils.formatEther(balanceOfCryptoDevTokens)} Crypto Dev Token
              </div>
              <div className="description">
                Overall  {utils.formatEther(tokenMinted)}/10000 have been minted
              </div>
            </div> 
            :
            <button className='button' onClick={connectWallet}>Connect Wallet</button>
          }
          {renderButton()}
        </div>
      </div>
   </>
  );
}

export default App;
