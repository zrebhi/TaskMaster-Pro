const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.registerUser); // POST /api/auth/register
router.post('/login', authController.loginUser); // POST /api/auth/login

module.exports = router;