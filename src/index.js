const { createServer } = require("./server/server");
const { getLogger } = require("./services/log.service");

const log = getLogger(__filename);

const port = process.env.PORT;

const app = createServer();

app.listen(port, () => {
    log.info("listen", `Server is running on port ${port}`);
});
