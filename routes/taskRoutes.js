
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');


router.use(auth);


router.put('/:taskId', taskController.updateTask);


router.put('/:taskId/status', taskController.updateTaskStatus);


router.put('/:taskId/progress', taskController.updateTaskProgress);

module.exports = router;
