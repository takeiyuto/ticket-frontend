import { createApp, reactive } from "vue";
import Web3 from "web3";
import MetaMaskOnboarding from "@metamask/onboarding";
import * as contract from "./contract";

// @ts-ignore
const ethereum: any = window.ethereum;

let web3: Web3 | null = null;
let tickets: contract.Tickets | null = null;

interface PriceRecord {
    validTo: number;
    price: string;
}

const data = reactive({
    isConnectingWallet: false,
    chainId: 0,
    account: "",
    currentBlock: 0,
    contractOwner: "",
    priceRecords: <PriceRecord[] | null>null,
    currentPrice: "",
    nextPrice: "",
    newValidTo: "",
    setPrice: "yes",
    newPrice: "",
    txErrorMessage: "",
});

createApp({
    data: () => data,
    computed: {
        isWalletConnected() { return !!this.account; },
        isOwner() { return this.account == this.contractOwner; },
        currentPriceText() { return contract.toEthOrInvalid(this.currentPrice); },
        nextPriceText() { return contract.toEthOrInvalid(this.nextPrice); },
    },
    created() {
        this.contractAddress = contract.address;
    },
    mounted() {
        if (MetaMaskOnboarding.isMetaMaskInstalled()) {
            ethereum.on("accountsChanged", (newAccounts: string[]) => {
                this.changeAccounts(newAccounts);
            });
            ethereum.on("chainChanged", (newChainId: string) => {
                this.chainId = Web3.utils.hexToNumber(newChainId);
            });
        }
    },
    methods: {
        async connectWallet() {
            if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
                (new MetaMaskOnboarding()).startOnboarding();
                return;
            }

            this.isConnectingWallet = true;
            try {
                web3 = new Web3(ethereum);
                const accounts = await web3.eth.requestAccounts();
                this.chainId = await web3.eth.getChainId();
                web3.eth.subscribe("newBlockHeaders", this.loadContractInfo);
                this.changeAccounts(accounts);

                tickets = <contract.Tickets><any>new web3.eth.Contract(contract.abi, contract.address);
                this.loadContractInfo();
            } catch (e) {
                // 接続がキャンセルされた状態。
                this.disconnectWallet();
            } finally {
                this.isConnectingWallet = false;
            }
        },
        changeAccounts(accounts: string[]) {
            if (!accounts || accounts.length == 0) {
                this.disconnectWallet();
            } else {
                this.account = accounts[0].toLowerCase();
            }
        },
        disconnectWallet() {
            web3?.eth.clearSubscriptions(undefined as any);
            web3 = null;
            this.account = "";
            this.contractOwner = "";
            this.priceRecords = null;
            this.txErrorMessage = "";
        },
        async loadContractInfo() {
            this.currentBlock = await web3!.eth.getBlockNumber();
            this.contractOwner = (await tickets!.methods.owner().call()).toLowerCase();
            this.currentPrice = await tickets!.methods.getCurrentPrice().call();
            this.nextPrice = await tickets!.methods.getPrice(this.currentBlock + 1).call();

            const recordCount = <number>Web3.utils.toNumber(await tickets!.methods.totalPriceRecords().call());
            const priceRecords: PriceRecord[] = new Array<PriceRecord>(recordCount);
            for (let i = 0; i < recordCount; i++) {
                const info = await tickets!.methods.priceRecords(i).call();
                priceRecords[i] = {
                    validTo: <number>Web3.utils.toNumber(info.validTo),
                    price: contract.toEthOrInvalid(info.price),
                };
            }
            this.priceRecords = priceRecords;
        },
        async callSetPrice() {
            this.txErrorMessage = "";
            try {
                const newPrice = Web3.utils.toWei(`${Math.round(this.newPrice * 1000)}`, "milli");
                const priceArg = this.setPrice === "yes" ? newPrice : contract.INVALID_PRICE;
                await tickets!.methods.setPrice(this.newValidTo, priceArg).send({
                    from: this.account
                });
            } catch (e: any) {
                this.txErrorMessage = e.message;
                return;
            }
        },
    },
}).mount("#app");
