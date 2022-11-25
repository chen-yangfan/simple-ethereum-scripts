import Web3 from 'web3';
import { USDT_ABI } from './contactABI/usdt.js';
import { ETHEREUM_GEROLI_NET_CONFIG, ETHEREUM_MAIN_NET_CONFIG } from './config.js'
const ETHEREUM_CONFIG = ETHEREUM_GEROLI_NET_CONFIG;
const PRIVATE_KEY = ETHEREUM_CONFIG.PRIVITE_KEY;
const PROVIDER_URL = ETHEREUM_CONFIG.RPC_URL;
const FROM_ADDRESS = ETHEREUM_CONFIG.ADDRESS;
const TO_ADDRESS = ETHEREUM_CONFIG.TO_ADDRESS;
const USDT_CONTRACT_ADDRESS = ETHEREUM_CONFIG.USDT_CONTACT_ADDRESS;
const web3 = new Web3(PROVIDER_URL);
const usdtContract = new web3.eth.Contract(
  USDT_ABI,
  USDT_CONTRACT_ADDRESS,
  { from: FROM_ADDRESS },
);
console.log('create provider', PROVIDER_URL);
const runWeb3 = async()=> {
  await getERC20TokenDecimals();
  await getERC20TokenBalance();
  await transferERC20Token(1);
  await transferETH(1);
}

export const getReceiptTransacion = async (trsHash) => {
  const receipt = await web3.eth.getTransactionReceipt(trsHash)
  console.log(receipt);
}

export const getContractFunctionSha3 = (functionName: string) => {
  console.log(web3.utils.sha3(functionName).substring(0, 10))
}

export const getContractTransferEstimateGas = async (toAddress: string, tokenAmout: number) => {
  // const data = contract.methods
  //   .transfer(toAddress, tokenAmout)
  //   .encodeABI();
  // const gasEstimateGase = await web3.eth.estimateGas({
  //   from: FROM_ADDRESS,
  //   to: USDT_CONTRACT_ADDRESS,
  //   data
  // });

  const gasEstimateGase = await usdtContract.methods
    .transfer(toAddress, tokenAmout)
    .estimateGas();
  console.log('预计需要花费gas:', gasEstimateGase);
  return gasEstimateGase
}

export const getERC20TokenDecimals = async () => {
  const decimals = await usdtContract.methods.decimals().call();
  console.log('合约token精度', decimals);
}

export const getERC20TokenBalance = async () => {
  const balance = await usdtContract.methods
    .balanceOf(FROM_ADDRESS)
    .call();
  console.log('token余额', balance);
}

export const getEstimateGasPrice = async () => {
  const gasPrice = await web3.eth.getGasPrice();
  console.log('预计gas基础费用:', gasPrice);
  return gasPrice
}

export const getCommonCreateTrsInfo = async () => {
  const nonce = await web3.eth.getTransactionCount(
    FROM_ADDRESS,
    'latest',
  );
  console.log('交易nonce', nonce)
  const estimateGasPrice = await getEstimateGasPrice();
  const maxPriorityFeePerGas = '1500000000'; //1.5Gwei
  console.log('设置最大矿工TIP费用', maxPriorityFeePerGas)
  const maxFeePerGas = (BigInt(estimateGasPrice) * BigInt(2) + BigInt(maxPriorityFeePerGas)).toString();
  console.log('设置最大费用', maxFeePerGas)
  const chainId = await web3.eth.getChainId();
  console.log('设置chainId', chainId);
  return { nonce, maxPriorityFeePerGas, maxFeePerGas, chainId }
}

export const transferERC20Token = async (tokenAmount: number) => {

  const data = usdtContract.methods
    .transfer(TO_ADDRESS, tokenAmount)
    .encodeABI();
  console.log('交易data', data)
  const estimateGas = await getContractTransferEstimateGas(TO_ADDRESS, tokenAmount);
  const { nonce, maxFeePerGas, maxPriorityFeePerGas, chainId } = await getCommonCreateTrsInfo()
  const contractTransactionObject = {
    nonce,
    to: USDT_CONTRACT_ADDRESS,
    value: '0',
    gas: estimateGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    data,
    chainId
  };
  const contractTrx_info = await web3.eth.accounts.signTransaction(
    contractTransactionObject,
    PRIVATE_KEY,
  );
  console.log('交易签名', contractTrx_info);
  const receiptTx = await web3.eth.sendSignedTransaction(
    contractTrx_info.rawTransaction!,
  );
  console.log('转账成功,交易回执:', receiptTx);
}

export const transferETH = async (amount: number) => {
  const { nonce, maxFeePerGas, maxPriorityFeePerGas, chainId } = await getCommonCreateTrsInfo()

  const transactionObject = {
    nonce,
    to: TO_ADDRESS,
    value: amount,
    gas: 21000,
    maxFeePerGas,
    maxPriorityFeePerGas,
    chainId

  };

  const trx_info = await web3.eth.accounts.signTransaction(
    transactionObject,
    PRIVATE_KEY,
  );

  console.log('交易签名：', trx_info);
  const receiptTx = await web3.eth.sendSignedTransaction(trx_info.rawTransaction!);
  
  console.log('转账成功,交易回执:', receiptTx);
}

runWeb3()