import { ethers } from 'ethers';
import { USDT_ABI } from './contactABI/usdt.js';
import { ETHEREUM_GEROLI_NET_CONFIG, ETHEREUM_MAIN_NET_CONFIG } from './config.js'
const ETHEREUM_CONFIG = ETHEREUM_GEROLI_NET_CONFIG;
const PRIVATE_KEY = ETHEREUM_CONFIG.PRIVITE_KEY;
const PROVIDER_URL = ETHEREUM_CONFIG.RPC_URL;
const FROM_ADDRESS = ETHEREUM_CONFIG.ADDRESS;
const TO_ADDRESS = ETHEREUM_CONFIG.TO_ADDRESS;
const USDT_CONTRACT_ADDRESS = ETHEREUM_CONFIG.USDT_CONTACT_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
console.log('create provider', PROVIDER_URL);
const signer = new ethers.Wallet(PRIVATE_KEY)
// const signer = new ethers.Wallet(PRIVATE_KEY, provider)
const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, JSON.stringify(USDT_ABI), signer);
const runEthers = async () => {
    // const signature = await signMessage('123');
    // await verifyMessage('123', signature);
    // await getERC20TokenDecimals();
    // await getERC20TokenBalance();
    // await transferERC20Token(1);
    // await transferETH(1);

    // 离线生成
    const transactionObject = {
        nonce:12,
        to: TO_ADDRESS,
        value: '1',
        gasLimit: '21000',
        maxFeePerGas:'150000000000',
        maxPriorityFeePerGas:'1000000000',
        chainId:1,
        type: 2,
    };

    const signedTxHash = await signer.signTransaction(
        transactionObject,
    );

    console.log('交易签名：', signedTxHash);
    const unsignedTx = await usdtContract.populateTransaction.transfer(TO_ADDRESS, '1')
    console.log('交易data', unsignedTx.data)
    console.log(ethers.utils.isAddress( TO_ADDRESS ))
    console.log('success')
}

// export const getReceiptTransacion = async (trsHash) => {
//     const receipt = await web3.eth.getTransactionReceipt(trsHash)
//     console.log(receipt);
// }

// export const getContractFunctionSha3 = (functionName: string) => {
//     console.log(web3.utils.sha3(functionName).substring(0, 10))
// }

export const getContractTransferEstimateGas = async (toAddress: string, tokenAmout: number) => {
    const unsignedTx = await usdtContract.populateTransaction.transfer(toAddress, tokenAmout)
    console.log('unsignedTx:', unsignedTx)
    const gasEstimateGase = (await signer.estimateGas(unsignedTx)).toString();

    // const gasEstimateGase = await usdtContract.estimateGas.transfer(toAddress, tokenAmout);
    console.log('预计需要花费gas:', gasEstimateGase);
    return gasEstimateGase
}

export const getERC20TokenDecimals = async () => {
    const decimals = await usdtContract.decimals()
    console.log('合约token精度', decimals.toString());
}

export const getERC20TokenBalance = async () => {
    const balance = await usdtContract.balanceOf(FROM_ADDRESS)
    console.log('token余额', balance.toString());
}

export const getEstimateGasPrice = async () => {
    const gasPrice = await signer.getGasPrice();
    console.log('预计gas基础费用:', gasPrice);
    return gasPrice
}

export const getCommonCreateTrsInfo = async () => {
    const nonce = await signer.getTransactionCount();
    console.log('交易nonce', nonce)
    const estimateGasPrice = (await getEstimateGasPrice()).toString();
    const maxPriorityFeePerGas = '1500000000'; //1.5Gwei
    console.log('设置最大矿工TIP费用', maxPriorityFeePerGas)
    const maxFeePerGas = (BigInt(estimateGasPrice) * BigInt(2) + BigInt(maxPriorityFeePerGas)).toString();
    console.log('设置最大费用', maxFeePerGas)
    const chainId = await signer.getChainId();
    console.log('设置chainId', chainId);
    return { nonce, maxPriorityFeePerGas, maxFeePerGas, chainId }
}

export const transferERC20Token = async (tokenAmount: number) => {

    const unsignedTx = await usdtContract.populateTransaction.transfer(TO_ADDRESS, tokenAmount)
    console.log('交易data', unsignedTx.data)
    const estimateGas = await getContractTransferEstimateGas(TO_ADDRESS, tokenAmount);
    const { nonce, maxFeePerGas, maxPriorityFeePerGas, chainId } = await getCommonCreateTrsInfo()
    const contractTransactionObject = {
        nonce,
        to: USDT_CONTRACT_ADDRESS,
        value: '0',
        gasLimit: estimateGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        data: unsignedTx.data,
        chainId,
        type: 2,
    };
    const tx = await signer.populateTransaction(contractTransactionObject)
    console.log('开始签名', tx);
    const signedTxHash = await signer.signTransaction(
        contractTransactionObject,
    );
    console.log('交易签名', signedTxHash);
    const transactionResponse = await provider.sendTransaction(signedTxHash)
    console.log('转账成功:', transactionResponse);
    const receiptTx = await transactionResponse.wait()
    console.log('交易回执', receiptTx)
}

export const transferETH = async (amount: number) => {
    const { nonce, maxFeePerGas, maxPriorityFeePerGas, chainId } = await getCommonCreateTrsInfo()

    const transactionObject = {
        nonce,
        to: TO_ADDRESS,
        value: amount,
        gasLimit: 21000,
        maxFeePerGas,
        maxPriorityFeePerGas,
        chainId,
        type: 2,
    };

    const signedTxHash = await signer.signTransaction(
        transactionObject,
    );

    console.log('交易签名：', signedTxHash);
    const transactionResponse = await provider.sendTransaction(signedTxHash)

    console.log('转账成功', transactionResponse);
    const receiptTx = await transactionResponse.wait()
    console.log('交易回执', receiptTx)
}

export const signMessage = async (message: string) => {
    const signature = await signer.signMessage(message);
    console.log('生成签名', signature);
    return signature;

}

export const verifyMessage = async (message: string, signature: string) => {
    const address = ethers.utils.verifyMessage(message, signature);
    console.log("签名地址：", address)
    return address
}
runEthers();