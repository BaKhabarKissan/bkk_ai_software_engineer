const express = require("express");
const chatController = require("./chat.controller");
const { validateSendMessage } = require("./chat.validation");

const router = express.Router();

router.get("/", chatController.getMessages);
router.post("/", validateSendMessage, chatController.sendMessage);

module.exports = router;
