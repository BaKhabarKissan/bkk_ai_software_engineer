const { createServer } = require("./server/server");
const { logger } = require("./services/log.service");

const { PORT } = process.env;

const app = createServer();

app.listen(PORT, () => {
    logger.info(`index.js [listen] Server is running on port ${PORT}`);
});
