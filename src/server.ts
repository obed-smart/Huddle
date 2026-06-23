import dotenv from "dotenv";
dotenv.config();

import app from "./app";

const startServer = async () => {
  const PORT = process.env.PORT || 3000;

  const server = app.listen(PORT, () => {
    // logger.info(`Server running on port ${PORT} 🚀`);
    console.log(`Server running on port ${PORT} 🚀`);
  });
};

startServer();
