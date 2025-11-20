import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';

import { addEmailToMailQueue } from '../producers/mailQueueProducer.js';
import channelRepository from '../repositories/channelRepository.js';
import userRepository from '../repositories/userRepository.js';
import workspaceRepository from '../repositories/workspaceRepository.js';
import  getWorkSpaceByJoinCode from '../repositories/workspaceRepository.js';
import mailObject from '../utils/common/mailObject.js';
import ClientError from '../utils/errors/clientError.js';
import ValidationError from '../utils/errors/validationError.js';

const isUserAdminOfWorkspace = (workspace, userId) => {
    return workspace.members.find(
            (member) => (member.memberId.toString() === userId || member.memberId._id.toString() === userId ) && member.role === 'admin'
        );
};

export const isUserMemberOfWorkspace = (workspace, userId) => {
    return workspace.members.find(
            (member) => member.memberId.toString() === userId
        );
};

const isChannelAlreadyPartOfWorkspace = (workspace, channelName) => {
    return workspace.channels.find(
            (channel) => channel.name.toLowerCase() === channelName.toLowerCase()
        );
}

export const createWorkspaceService = async (workspaceData) => {
    try {
        const joinCode = uuidv4().substring(0, 6).toUpperCase();

        const response = await workspaceRepository.create({
            name: workspaceData.name,
            description: workspaceData.description,
            joinCode
        });

        await workspaceRepository.addMemberToWorkspace(
            response._id,
            workspaceData.owner,
            'admin'
        );

        const updatedWorkspace = await workspaceRepository.addChannelToWorkspace(response._id, 'general');

        return updatedWorkspace;

    } catch (error) {
        if (error.name === 'ValidationError') {
            throw new ValidationError(
                {
                    error: error.errors
                },
                error.message
            );
        }
        if (error.name === 'MongoServerError' && error.code === 11000) {
            throw new ValidationError(
                {
                    error: ['A workspace with same details already exists.']
                },
                'A workspace with same details already exists.'
            );
        }
        throw error;
    }

};

export const getWorkspacesUserIsMemberOfService = async (userId) => {
    try {
        const response = await workspaceRepository.fetchAllWorkspaceByMemberId(userId);
        return response;
    } catch (error) {
        console.log('Get workspaces user is member of service error', error);
        throw error;
    }
};

export const deleteWorkspaceService = async (workspaceId, userId) => {
    try {
        const workspace = await workspaceRepository.getById(workspaceId);
        if (!workspace) {
            throw new ClientError({
                explanation: 'Workspace not found',
                message: 'The workspace you are trying to delete does not exist',
                statusCode: StatusCodes.NOT_FOUND
            });
        }
        const isAllowed = isUserAdminOfWorkspace(workspace, userId);

        if (isAllowed) {
            await channelRepository.deleteMany(workspace.channels);

            const response = await workspaceRepository.delete(workspaceId);
            return response;
        }
        throw new ClientError({
            explanation: 'User not authorized to delete this workspace',
            message: 'You do not have permission to delete this workspace',
            statusCode: StatusCodes.UNAUTHORIZED
        });
    } catch (error) {
        console.log(error);
        throw error;
    }
    
};

export const getWorkspaceService = async (workspaceId, userId) => {
    try {
        const workspace = await workspaceRepository.getById(workspaceId);
        if (!workspace) {
            throw new ClientError({
                explanation: 'Invalid data sent from the client',
                message: 'Workspace not found',
                statusCode: StatusCodes.NOT_FOUND
            });
        }      
        const isMember = isUserMemberOfWorkspace(workspace, userId);
        if (!isMember) {
            throw new ClientError({
                explanation: 'User is not a member of this workspace',
                message: 'User is not a member of this workspace',
                statusCode: StatusCodes.UNAUTHORIZED
            });
        }
        return workspace;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const getWorkspaceByJoinCodeService = async (joinCode, userId) => {
    try {
        const workspace = await workspaceRepository.getWorkSpaceByJoinCode(joinCode);
        if (!workspace) {
            throw new ClientError({
                explanation: 'Invalid data sent from the client',
                message: 'Workspace not found',
                statusCode: StatusCodes.NOT_FOUND
            });
        }

        const isMember = isUserMemberOfWorkspace(workspace, userId);
        if (!isMember) {
            throw new ClientError({
                explanation: 'User is not a member of this workspace',
                message: 'User is not a member of this workspace',
                statusCode: StatusCodes.UNAUTHORIZED
            });
        }
        return workspace;
    } catch (error) {
        console.log('Get workspace by join code service error', error);
        throw error;
    }
};

export const updateWorkspaceService = async (workspaceId, workspaceData, userId) => {
    try {
        const workspace = await workspaceRepository.getById(workspaceId);
        if (!workspace) {
            throw new ClientError({
                explanation: 'Invalid data sent from the client',
                message: 'Workspace not found',
                statusCode: StatusCodes.NOT_FOUND
            });
        }

        const isAdmin = isUserAdminOfWorkspace(workspace, userId);
        if (!isAdmin) {
            throw new ClientError({
                explanation: 'User is not authorized to update this workspace',
                message: 'User is not authorized to update this workspace',
                statusCode: StatusCodes.UNAUTHORIZED
            });
        }
        const updatedWorkspace = await workspaceRepository.update(workspaceId, workspaceData);
        return updatedWorkspace;
    } catch (error) {
        console.log('Update workspace by join code service error', error);
        throw error;
    }
};

export const addMemberToWorkspaceService = async (workspaceId, memberId, role, userId) => {
    try {
        const workspace = await workspaceRepository.getById(workspaceId);
        if (!workspace) {
            throw new ClientError({
                explanation: 'Invalid data sent from the client',
                message: 'Workspace not found',
                statusCode: StatusCodes.NOT_FOUND
            });
        }

        const isAdmin = isUserAdminOfWorkspace(workspace, userId);
        if (!isAdmin) {
            throw new ClientError({
                explanation: 'User is not admin to add member to this workspace',
                message: 'User is not admin to add member to this workspace',
                statusCode: StatusCodes.UNAUTHORIZED
            });
        }
        const isValidUser = await userRepository.getById(memberId);
        if (!isValidUser) {
            throw new ClientError({
                explanation: 'Invalid data sent from the client',
                message: 'User not found',
                statusCode: StatusCodes.NOT_FOUND
            });
        }

        const isMember = isUserMemberOfWorkspace(workspace, memberId);
        if (isMember) {
            throw new ClientError({
                explanation: 'User is already a member of this workspace',
                message: 'User is already a member of this workspace',
                statusCode: StatusCodes.UNAUTHORIZED
            });
        }
        const response = await workspaceRepository.addMemberToWorkspace(workspaceId, memberId, role);

        addEmailToMailQueue({
            ...mailObject,
            to: isValidUser.email,
            subject: `Added to workspace: ${workspace.name}`,
            text: `You have been added to the workspace: ${workspace.name} with the role of ${role}.`
        })

        return response;
    } catch (error) {
        console.log('Add member to workspace service error', error);
        throw error;
    }
}

export const addChannelToWorkspaceService = async (workspaceId, channelName, userId) => {
    try {
        const workspace = await workspaceRepository.getWorkspaceDetailsById(workspaceId);
        if (!workspace) {
            throw new ClientError({
                explanation: 'Invalid data sent from the client',
                message: 'Workspace not found',
                statusCode: StatusCodes.NOT_FOUND
            });
        }
        const isAdmin = isUserAdminOfWorkspace(workspace, userId);
        if (!isAdmin) {
            throw new ClientError({
                explanation: 'User is not admin to add channel to this workspace',
                message: 'User is not admin to add channel to this workspace',
                statusCode: StatusCodes.UNAUTHORIZED
            });
        }
        const isChannelPartOfWorkspace = isChannelAlreadyPartOfWorkspace(workspace, channelName);
        if (isChannelPartOfWorkspace) {
            throw new ClientError({
                explanation: 'Invalid data sent from the client',
                message: 'Channel already exists in this workspace',
                statusCode: StatusCodes.FORBIDDEN
            });
        }
        const response = await workspaceRepository.addChannelToWorkspace(workspaceId, channelName);
        return response;
    } catch (error) {
        console.log('Add channel to workspace service error', error);
        throw error;
    }
}