const express = require('express')
const userController = require('../controllers/userController')
const verifyToken = require('../middleware/VerifyToken')
const refreshToken = require('../controllers/refreshToken')

const router = express.Router()


router.post('/api/register', userController.postRegister)
router.post('/api/login', userController.postLogin)
router.post('/api/files', userController.postFiles)

router.get('/api/users', verifyToken.verifyToken, userController.getUsers)
router.get('/api/files', userController.getFiles)

router.get('/api/token', refreshToken.getrefreshToken)
router.get('/api/logout', userController.getLogout)


module.exports = router