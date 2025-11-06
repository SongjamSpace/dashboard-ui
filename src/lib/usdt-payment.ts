import { ethers } from "ethers";
import type { ConnectedWallet } from "@privy-io/react-auth";
import { mainnet } from "viem/chains";

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

const DEFAULT_USDT_DECIMALS = 6;

type ChainIdParam = `0x${string}` | number;

interface ChainConfig {
  numeric: number;
  param: ChainIdParam;
}

const parseChainId = (raw?: string): ChainConfig => {
  if (!raw) {
    return {
      numeric: mainnet.id,
      param: mainnet.id,
    };
  }

  const trimmed = raw.trim();
  if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
    const numeric = Number.parseInt(trimmed, 16);
    if (!Number.isNaN(numeric) && numeric > 0) {
      return {
        numeric,
        param: trimmed as `0x${string}`,
      };
    }
  } else {
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric) && numeric > 0) {
      return {
        numeric,
        param: numeric,
      };
    }
  }

  return {
    numeric: mainnet.id,
    param: mainnet.id,
  };
};

export interface SendUsdtPaymentParams {
  wallet: ConnectedWallet;
  payoutAddress: string;
  usdtContractAddress: string;
  amount: number;
  chainIdOverride?: string;
}

export interface SendUsdtPaymentResult {
  approvalTxHash?: string;
  transferTxHash: string;
}

async function getUsdtContract(
  wallet: ConnectedWallet,
  usdtContractAddress: string,
  chainIdOverride?: string
) {
  const chainConfig = parseChainId(chainIdOverride);

  let providerSource = await wallet.getEthereumProvider();
  let provider = new ethers.BrowserProvider(providerSource);

  const targetChainId = BigInt(chainConfig.numeric);

  try {
    const network = await provider.getNetwork();
    if (network.chainId !== targetChainId) {
      await wallet.switchChain(chainConfig.param);
      providerSource = await wallet.getEthereumProvider();
      provider = new ethers.BrowserProvider(providerSource);
    }
  } catch (chainError) {
    throw new Error(
      `Failed to ensure correct network for booking: ${
        (chainError as Error)?.message ?? chainError
      }`
    );
  }

  const signer = await provider.getSigner();
  const usdtContract = new ethers.Contract(
    usdtContractAddress,
    ERC20_ABI,
    signer
  );

  let tokenDecimals = DEFAULT_USDT_DECIMALS;
  try {
    const decimals = await usdtContract.decimals();
    const parsedDecimals = Number(decimals);
    if (!Number.isNaN(parsedDecimals) && parsedDecimals > 0) {
      tokenDecimals = parsedDecimals;
    }
  } catch (decimalsError) {
    console.warn(
      "Failed to fetch token decimals; defaulting to 6",
      decimalsError
    );
  }

  return { usdtContract, tokenDecimals };
}

export interface ApproveUsdtPaymentParams {
  wallet: ConnectedWallet;
  payoutAddress: string;
  usdtContractAddress: string;
  amount: number;
  chainIdOverride?: string;
}

export interface ApproveUsdtPaymentResult {
  approvalTxHash: string;
}

export const approveUsdtPayment = async (
  params: ApproveUsdtPaymentParams
): Promise<ApproveUsdtPaymentResult> => {
  const {
    wallet,
    payoutAddress,
    usdtContractAddress,
    amount,
    chainIdOverride,
  } = params;

  if (!ethers.isAddress(payoutAddress)) {
    throw new Error("Invalid payout address configured for this show");
  }

  if (!ethers.isAddress(usdtContractAddress)) {
    throw new Error("Invalid USDT contract address configuration");
  }

  if (amount <= 0) {
    throw new Error("Transfer amount must be greater than zero");
  }

  const { usdtContract, tokenDecimals } = await getUsdtContract(
    wallet,
    usdtContractAddress,
    chainIdOverride
  );

  const transferAmount = ethers.parseUnits(amount.toString(), tokenDecimals);

  const approvalTx = await usdtContract.approve(payoutAddress, transferAmount);
  const approvalReceipt = await approvalTx.wait();

  return {
    approvalTxHash: approvalReceipt?.hash ?? approvalTx.hash,
  };
};

export interface TransferUsdtPaymentParams {
  wallet: ConnectedWallet;
  payoutAddress: string;
  usdtContractAddress: string;
  amount: number;
  chainIdOverride?: string;
}

export interface TransferUsdtPaymentResult {
  transferTxHash: string;
}

export const transferUsdtPayment = async (
  params: TransferUsdtPaymentParams
): Promise<TransferUsdtPaymentResult> => {
  const {
    wallet,
    payoutAddress,
    usdtContractAddress,
    amount,
    chainIdOverride,
  } = params;

  if (!ethers.isAddress(payoutAddress)) {
    throw new Error("Invalid payout address configured for this show");
  }

  if (!ethers.isAddress(usdtContractAddress)) {
    throw new Error("Invalid USDT contract address configuration");
  }

  if (amount <= 0) {
    throw new Error("Transfer amount must be greater than zero");
  }

  const { usdtContract, tokenDecimals } = await getUsdtContract(
    wallet,
    usdtContractAddress,
    chainIdOverride
  );

  const transferAmount = ethers.parseUnits(amount.toString(), tokenDecimals);

  const transferTx = await usdtContract.transfer(payoutAddress, transferAmount);
  const transferReceipt = await transferTx.wait();

  return {
    transferTxHash: transferReceipt?.hash ?? transferTx.hash,
  };
};

export const sendUsdtPayment = async (
  params: SendUsdtPaymentParams
): Promise<SendUsdtPaymentResult> => {
  const approvalResult = await approveUsdtPayment(params);
  const transferResult = await transferUsdtPayment(params);

  return {
    approvalTxHash: approvalResult.approvalTxHash,
    transferTxHash: transferResult.transferTxHash,
  };
};
