
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');


router.use(auth);


router.get('/', projectController.getUserProjects);


router.post('/', projectController.createProject);


router.get('/:projectId', projectController.getProjectDetails);


router.put('/:projectId', projectController.updateProject);


router.put('/:projectId/complete', projectController.completeProject);


router.post('/:projectId/tasks', taskController.createTask);

module.exports = router;
