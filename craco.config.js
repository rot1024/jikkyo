module.exports = {
  webpack: {
    alias: {
      "react-dom": "@hot-loader/react-dom"
    }
  },
  plugins: [{ plugin: require("craco-plugin-react-hot-reload") }]
};
