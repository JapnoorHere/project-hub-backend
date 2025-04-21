
const Project = require('../models/Project');
const Task = require('../models/Task');
const mongoose = require('mongoose');


const calculateProjectProgress = async (projectId) => {
    try {
        const tasks = await Task.find({ project: projectId });
        
        if (tasks.length === 0) {
            return 0;
        }
        
        const totalTasks = tasks.length;
        let completedTaskCount = 0;
        let totalProgress = 0;
        
        tasks.forEach(task => {
            totalProgress += task.progress;
            if (task.status === 'COMPLETED') {
                completedTaskCount++;
            }
        });
        
        return Math.round(totalProgress / totalTasks);
        
    } catch (error) {
        console.error('Error calculating project progress:', error);
        return 0;
    }
};


exports.getUserProjects = async (req, res) => {
    try {
        
        const projects = await Project.find({
            $or: [
                { createdBy: req.userId },
                { members: req.userId }
            ]
        }).populate('createdBy members', 'name email profilePicUrl');
        
        
        const projectsWithTasks = await Promise.all(projects.map(async (project) => {
            const tasks = await Task.find({ project: project._id })
                .populate('assignedTo assignedBy', 'name email profilePicUrl');
            
            return {
                id: project._id,
                name: project.name,
                description: project.description,
                startDate: project.startDate.getTime(),
                endDate: project.endDate.getTime(),
                createdBy: {
                    id: project.createdBy._id,
                    name: project.createdBy.name,
                    email: project.createdBy.email,
                    profilePicUrl: project.createdBy.profilePicUrl
                },
                members: project.members.map(member => ({
                    id: member._id,
                    name: member.name,
                    email: member.email,
                    profilePicUrl: member.profilePicUrl
                })),
                tasks: tasks.map(task => ({
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
                })),
                isCompleted: project.isCompleted,
                progress: project.progress
            };
        }));
        
        res.json(projectsWithTasks);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.createProject = async (req, res) => {
    try {
        const { name, description, startDate, endDate, memberIds } = req.body;
        
        
        let project = new Project({
            name,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            createdBy: req.userId,
            members: [req.userId] 
        });
        
        
        if (memberIds && memberIds.length > 0) {
            
            const uniqueMembers = [...new Set(memberIds)]
                .filter(id => id.toString() !== req.userId.toString());
            
            project.members = [...project.members, ...uniqueMembers];
        }
        
        await project.save();
        
        
        project = await Project.findById(project._id)
            .populate('createdBy members', 'name email profilePicUrl');
        
        res.status(201).json({
            id: project._id,
            name: project.name,
            description: project.description,
            startDate: project.startDate.getTime(),
            endDate: project.endDate.getTime(),
            createdBy: {
                id: project.createdBy._id,
                name: project.createdBy.name,
                email: project.createdBy.email,
                profilePicUrl: project.createdBy.profilePicUrl
            },
            members: project.members.map(member => ({
                id: member._id,
                name: member.name,
                email: member.email,
                profilePicUrl: member.profilePicUrl
            })),
            tasks: [],
            isCompleted: project.isCompleted,
            progress: project.progress
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getProjectDetails = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        
        
        const project = await Project.findById(projectId)
            .populate('createdBy members', 'name email profilePicUrl');
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        
        if (!project.members.some(member => member._id.toString() === req.userId.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        
        const tasks = await Task.find({ project: projectId })
            .populate('assignedTo assignedBy', 'name email profilePicUrl');
        
        res.json({
            id: project._id,
            name: project.name,
            description: project.description,
            startDate: project.startDate.getTime(),
            endDate: project.endDate.getTime(),
            createdBy: {
                id: project.createdBy._id,
                name: project.createdBy.name,
                email: project.createdBy.email,
                profilePicUrl: project.createdBy.profilePicUrl
            },
            members: project.members.map(member => ({
                id: member._id,
                name: member.name,
                email: member.email,
                profilePicUrl: member.profilePicUrl
            })),
            tasks: tasks.map(task => ({
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
            })),
            isCompleted: project.isCompleted,
            progress: project.progress
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.updateProject = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const { name, description, startDate, endDate, memberIds } = req.body;
        
        
        let project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        
        if (project.createdBy.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        
        project.name = name || project.name;
        project.description = description || project.description;
        
        if (startDate) {
            project.startDate = new Date(startDate);
        }
        
        if (endDate) {
            project.endDate = new Date(endDate);
        }
        
        
        if (memberIds && memberIds.length > 0) {
            
            const uniqueMembers = [...new Set([req.userId.toString(), ...memberIds])];
            project.members = uniqueMembers;
        }
        
        await project.save();
        
        
        project = await Project.findById(projectId)
            .populate('createdBy members', 'name email profilePicUrl');
        
        
        const tasks = await Task.find({ project: projectId })
            .populate('assignedTo assignedBy', 'name email profilePicUrl');
        
        res.json({
            id: project._id,
            name: project.name,
            description: project.description,
            startDate: project.startDate.getTime(),
            endDate: project.endDate.getTime(),
            createdBy: {
                id: project.createdBy._id,
                name: project.createdBy.name,
                email: project.createdBy.email,
                profilePicUrl: project.createdBy.profilePicUrl
            },
            members: project.members.map(member => ({
                id: member._id,
                name: member.name,
                email: member.email,
                profilePicUrl: member.profilePicUrl
            })),
            tasks: tasks.map(task => ({
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
            })),
            isCompleted: project.isCompleted,
            progress: project.progress
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.completeProject = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        
        
        let project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        
        if (!project.members.some(member => member.toString() === req.userId.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        
        project.isCompleted = true;
        project.progress = 100;
        
        await project.save();
        
        
        await Task.updateMany(
            { project: projectId },
            { status: 'COMPLETED', progress: 100 }
        );
        
        
        project = await Project.findById(projectId)
            .populate('createdBy members', 'name email profilePicUrl');
        
        
        const tasks = await Task.find({ project: projectId })
            .populate('assignedTo assignedBy', 'name email profilePicUrl');
        
        res.json({
            id: project._id,
            name: project.name,
            description: project.description,
            startDate: project.startDate.getTime(),
            endDate: project.endDate.getTime(),
            createdBy: {
                id: project.createdBy._id,
                name: project.createdBy.name,
                email: project.createdBy.email,
                profilePicUrl: project.createdBy.profilePicUrl
            },
            members: project.members.map(member => ({
                id: member._id,
                name: member.name,
                email: member.email,
                profilePicUrl: member.profilePicUrl
            })),
            tasks: tasks.map(task => ({
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
            })),
            isCompleted: project.isCompleted,
            progress: project.progress
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// controllers/projectController.js

// Add members to a project
exports.addMembers = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const { memberIds } = req.body;
        
        if (!memberIds || !Array.isArray(memberIds)) {
            return res.status(400).json({ message: 'Member IDs array is required' });
        }
        
        // Check if project exists
        let project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        // Check if user is a member of the project
        if (!project.members.some(member => member.toString() === req.userId.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Add new members to the project
        const currentMemberIds = project.members.map(id => id.toString());
        const newUniqueMembers = memberIds.filter(id => !currentMemberIds.includes(id));
        
        if (newUniqueMembers.length > 0) {
            project.members = [...project.members, ...newUniqueMembers];
            await project.save();
        }
        
        // Populate the updated project
        project = await Project.findById(projectId)
            .populate('createdBy members', 'name email profilePicUrl');
        
        // Get tasks for the project
        const tasks = await Task.find({ project: projectId })
            .populate('assignedTo assignedBy', 'name email profilePicUrl');
        
        res.json({
            id: project._id,
            name: project.name,
            description: project.description,
            startDate: project.startDate.getTime(),
            endDate: project.endDate.getTime(),
            createdBy: {
                id: project.createdBy._id,
                name: project.createdBy.name,
                email: project.createdBy.email,
                profilePicUrl: project.createdBy.profilePicUrl
            },
            members: project.members.map(member => ({
                id: member._id,
                name: member.name,
                email: member.email,
                profilePicUrl: member.profilePicUrl
            })),
            tasks: tasks.map(task => ({
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
            })),
            isCompleted: project.isCompleted,
            progress: project.progress
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
