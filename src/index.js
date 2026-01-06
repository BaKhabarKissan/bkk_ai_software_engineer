const { createServer } = require("./server/server");
const { logger } = require("./services/log.service");

const port = process.env.PORT;

const app = createServer();

app.listen(port, () => {
    logger.info(`index.js [listen] Server is running on port ${port}`);
});
