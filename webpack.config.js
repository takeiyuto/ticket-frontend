const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: {
        "user": "./src/index.ts",
        "admin": "./src/admin.ts",
    },
    plugins: [
        new HtmlWebpackPlugin({
            chunks: ["user"],
            template: "./src/index.html",
            filename: "index.html",
        }),
        new HtmlWebpackPlugin({
            chunks: ["admin"],
            template: "./src/admin.html",
            filename: "admin.html",
        }),
    ],
    resolve: {
        extensions: [".js", ".ts"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/i,
                loader: "ts-loader",
            }
        ],
    },
    externals: {
        "@metamask/onboarding": "MetaMaskOnboarding",
        vue: "Vue",
        web3: "Web3",
    },
};
