module.exports = {
  presets: [
    "@babel/preset-env", // Transpiles modern JavaScript
    ["@babel/preset-react", { runtime: "automatic" }], // Transpiles JSX
  ],
};
