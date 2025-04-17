
const Task = require('../models/Task');
const Project = require('../models/Project');


const calculateProjectProgress = async (projectId) => {
    try {
        const tasks = await Task.find({ project: projectId });
        
        if (tasks.length === 0) {
            return 0;
        }
        
        const totalTasks = tasks.length;
        let totalProgress = 0;
        
        tasks.forEach(task => {
            totalProgress += task.progress;
        });
        
        return Math.round(totalProgress / totalTasks);
        
    } catch (error) {
        console.error('Error calculating project progress:', error);
        return 0;
    }
};


exports.createTask = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const { title, description, dueDate, assignedToId } = req.body;
        
        
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        
        if (!project.members.some(member => member.toString() === req.userId.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        
        if (!project.members.some(member => member.toString() === assignedToId)) {
            return res.status(400).json({ message: 'Assignee must be a member of the project' });
        }
        
        
        let task = new Task({
            title,
            description,
            dueDate: new Date(dueDate),
            project: projectId,
            assignedTo: assignedToId,
            assignedBy: req.userId,
            status: 'PENDING',
            progress: 0
        });
        
        await task.save();
        
        
        task = await Task.findById(task._id)
            .populate('assignedTo assignedBy', 'name email profilePicUrl');
        
        
        const progress = await calculateProjectProgress(projectId);
        await Project.findByIdAndUpdate(projectId, { progress });
        
        res.status(201).json({
            id: task._id,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate.getTime(),
            assignedTo: {
                id: task.assignedTo._id,
                name: task.assignedTo.name,
                email: task.assignedTo.email,
                profilePicUrl: task.assignedTo.profilePicUrl
            },
            assignedBy: {
                id: task.assignedBy._id,
                name: task.assignedBy.name,
                email: task.assignedBy.email,
                profilePicUrl: task.assignedBy.profilePicUrl
            },
            status: task.status,
            progress: task.progress
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.updateTask = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const { title, description, dueDate, assignedToId } = req.body;
        
        
        let task = await Task.findById(taskId);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        
        const project = await Project.findById(task.project);
        
        if (!project.members.some(member => member.toString() === req.userId.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        
        if (assignedToId && !project.members.some(member => member.toString() === assignedToId)) {
            return res.status(400).json({ message: 'Assignee must be a member of the project' });
        }
        
        
        task.title = title || task.title;
        task.description = description || task.description;
        
        if (dueDate) {
            task.dueDate = new Date(dueDate);
        }
        
        if (assignedToId) {
            task.assignedTo = assignedToId;
        }
        
        await task.save();
        
        
        task = await Task.findById(taskId)
            .populate('assignedTo assignedBy', 'name email profilePicUrl');
        
        res.json({
            id: task._id,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate.getTime(),
            assignedTo: {
                id: task.assignedTo._id,
                name: task.assignedTo.name,
                email: task.assignedTo.email,
                profilePicUrl: task.assignedTo.profilePicUrl
            },
            assignedBy: {
                id: task.assignedBy._id,
                name: task.assignedBy.name,
                email: task.assignedBy.email,
                profilePicUrl: task.assignedBy.profilePicUrl
            },
            status: task.status,
            progress: task.progress
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.updateTaskStatus = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const { status } = req.body;
        
        
        let task = await Task.findById(taskId);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        
        const project = await Project.findById(task.project);
        
        if (!project.members.some(member => member.toString() === req.userId.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        
        task.status = status;
        
        
        if (status === 'COMPLETED') {
            task.progress = 100;
        } else if (status === 'IN_PROGRESS' && task.progress === 0) {
            task.progress = 50;
        }
        
        await task.save();
        
        
        const progress = await calculateProjectProgress(task.project);
        await Project.findByIdAndUpdate(task.project, { progress });
        
        
        task = await Task.findById(taskId)
            .populate('assignedTo assignedBy', 'name email profilePicUrl');
        
        res.json({
            id: task._id,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate.getTime(),
            assignedTo: {
                id: task.assignedTo._id,
                name: task.assignedTo.name,
                email: task.assignedTo.email,
                profilePicUrl: task.assignedTo.profilePicUrl
            },
            assignedBy: {
                id: task.assignedBy._id,
                name: task.assignedBy.name,
                email: task.assignedBy.email,
                profilePicUrl: task.assignedBy.profilePicUrl
            },
            status: task.status,
            progress: task.progress
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.updateTaskProgress = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const { progress } = req.body;
        
        
        let task = await Task.findById(taskId);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        
        const project = await Project.findById(task.project);
        
        if (!project.members.some(member => member.toString() === req.userId.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        
        task.progress = progress;
        
        
        if (progress === 100) {
            task.status = 'COMPLETED';
        } else if (progress > 0 && task.status === 'PENDING') {
            task.status = 'IN_PROGRESS';
        }
        
        await task.save();
        
        
        const projectProgress = await calculateProjectProgress(task.project);
        await Project.findByIdAndUpdate(task.project, { progress: projectProgress });
        
        
        task = await Task.findById(taskId)
            .populate('assignedTo assignedBy', 'name email profilePicUrl');
        
        res.json({
            id: task._id,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate.getTime(),
            assignedTo: {
                id: task.assignedTo._id,
                name: task.assignedTo.name,
                email: task.assignedTo.email,
                profilePicUrl: task.assignedTo.profilePicUrl
            },
            assignedBy: {
                id: task.assignedBy._id,
                name: task.assignedBy.name,
                email: task.assignedBy.email,
                profilePicUrl: task.assignedBy.profilePicUrl
            },
            status: task.status,
            progress: task.progress
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
