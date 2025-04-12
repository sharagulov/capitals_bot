module.exports = {
  apps: [
    {
      name: "capitals-bot",
      script: "src/bot.ts",
      interpreter: "npx",
      interpreter_args: "ts-node -r tsconfig-paths/register",
      env: {
        NODE_ENV: "development",
      },
      watch: true
    },
  ],
};
