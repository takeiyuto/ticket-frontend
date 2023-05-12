import BN from "bn.js";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import ticketsJson from "../../blockchain/build/contracts/Tickets.json";

export { Tickets } from "./types/Tickets";

export const abi = <AbiItem[]>ticketsJson.abi;

export const address = "0x...CONTRACT_ADDRESS...";

export const INVALID_PRICE: BN = new BN(2).pow(new BN(96)).subn(1);

export function isValidPrice(wei: string): boolean {
    return !new BN(wei).ltn(0) && new BN(wei).lt(INVALID_PRICE);
}

export function toEthOrInvalid(wei: string): string {
    try {
        if (isValidPrice(wei)) {
            return Web3.utils.fromWei(wei);
        }
    } catch {
    }
    return "販売休止";
}

export function fromEth(ether: number): string {
    return Web3.utils.toWei(`${ether * 1000}`, "milli");
}
