"use strict";

module.exports.rules = {
  "no-hardcoded-palette": require("./rules/no-hardcoded-palette"),
};

module.exports.configs = {
  recommended: {
    plugins: ["aibos-ui"],
    rules: {
      "aibos-ui/no-hardcoded-palette": "error"
    }
  }
};
