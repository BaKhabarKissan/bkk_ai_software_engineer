const { createServer } = require("./server/server");
const { getLogger } = require("./services/log.service");

const log = getLogger(__filename);

const PORT = process.env.PORT || 5000;

const app = createServer();

app.listen(PORT, () => {
    log.info("listen", `Server is running on port ${PORT}`);
});
