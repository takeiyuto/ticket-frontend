# Ticket Frontend

[Ticket NFT](https://github.com/takeiyuto/tickets) のフロントエンドです。

## 前提条件

このレポジトリの親ディレクトリに、`blockchain` という名称で [Ticket NFT のコントラクト](https://github.com/takeiyuto/ticket-contract)のプロジェクトがあること。また、コントラクトはコンパイルされて、デプロイ済みであること。詳細は、[徹底解説 NFTの理論と実践](https://www.ohmsha.co.jp/book/9784274230608/)の第8章2節を参照してください。

## 動作方法

1. このレポジトリをクローンし、ライブラリをダウンロードします。
```bash
git clone https://github.com/takeiyuto/ticket-frontend.git frontend
cd frontend
yarn
```

2. コントラクトの型情報を生成します。
```bash
yarn type
```

3. [contract.ts](./src/contract.ts) の 10 行目にある以下のような `address` 定数に、既にデプロイしてある Ticket NFT コントラクトのアドレスを記述します。
```ts
export const address = "0x...CONTRACT_ADDRESS...";
```

4. webpack でコンパイルからバンドルまで行います。
```bash
yarn build
```

5. Ticket Frontend は、[Ticket NFT のバックエンド](https://github.com/takeiyuto/ticket-backend)で起動した Node.js の Express サーバから提供されます。起動の方法は、[Ticket Backend の README.md](https://github.com/takeiyuto/ticket-backend/blob/main/README.md) を参照してください。

## ライセンス表示

このサンプル コードは、[MIT License](LICENSE)で提供しています。

# 参照

[徹底解説 NFTの理論と実践](https://www.ohmsha.co.jp/book/9784274230608/)の第8章3節を参照してください。[本書の Web サイト](https://takeiyuto.github.io/nft-book)も参考にしてください。
