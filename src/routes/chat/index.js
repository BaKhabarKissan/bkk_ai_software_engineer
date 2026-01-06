const express = require("express");
const { validateRequest } = require("../../services/validation.service");
const chatController = require("./chat.controller");
const { sendMessageSchema } = require("./chat.validation");

const router = express.Router();

router.get("/", chatController.getMessages);
router.post("/", validateRequest(sendMessageSchema), chatController.sendMessage);

module.exports = router;
