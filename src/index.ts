import { createApp, reactive } from "vue";
import Web3 from "web3";
import MetaMaskOnboarding from "@metamask/onboarding";
import * as contract from "./contract";

// @ts-ignore
const ethereum: any = window.ethereum;

let web3: Web3 | null = null;
let tickets: contract.Tickets | null = null;

const data = reactive({
    isConnectingWallet: false,
    chainId: 0,
    account: "",
    currentBlock: 0,
    nextPrice: "",
    tokenId: 0,
    txErrorMessage: "",
    loginMessage: `今の時刻: ${new Date().toISOString()}`,
    signature: "",
    signErrorMessage: "",
    iframUrl: "",
});

createApp({
    data: () => data,
    computed: {
        isWalletConnected() { return !!this.account; },
        nextPriceText() { return contract.toEthOrInvalid(this.nextPrice); },
        isOnSaleAtNextBlock() { return contract.isValidPrice(this.nextPrice); },
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
            tickets = null;
            this.account = "";
            this.txErrorMessage = "";
            this.signErrorMessage = "";
        },
        async loadContractInfo() {
            this.currentBlock = await web3!.eth.getBlockNumber();
            this.nextPrice = await tickets!.methods.getPrice(this.currentBlock + 1).call();

            const balanceString = await tickets!.methods.balanceOf(this.account).call();
            if (Web3.utils.toNumber(balanceString) == 0) {
                this.tokenId = 0;
                return;
            }

            const tokenIdString = await tickets!.methods.firstTokenOfOwner(this.account).call();
            this.tokenId = Web3.utils.toNumber(tokenIdString);
        },
        async purchaseTicket() {
            this.txErrorMessage = "";
            try {
                await tickets!.methods.purchase().send({
                    from: this.account,
                    value: this.nextPrice,
                });
            } catch (e: any) {
                this.txErrorMessage = e.message;
            }
        },
        async refundTicket() {
            this.txErrorMessage = "";
            try {
                await tickets!.methods.refund(this.tokenId).send({
                    from: this.account,
                });
            } catch (e: any) {
                this.txErrorMessage = e.message;
            }
        },
        async sign() {
            this.signErrorMessage = "";
            try {
                this.signature = await web3!.eth.personal.sign(this.loginMessage, this.account, "");
            } catch (e: any) {
                this.signErrorMessage = e.message;
            }
        },
        login() {
            const url = new URL("/login", document.URL);
            url.searchParams.append("msg", this.loginMessage);
            url.searchParams.append("sig", this.signature);
            this.iframUrl = url.toString();
        },
    },
}).mount("#app");
