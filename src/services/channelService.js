import { StatusCodes } from 'http-status-codes';

import channelRepository from '../repositories/channelRepository.js';
import messageRepository from '../repositories/messageRepository.js';
import ClientError from '../utils/errors/clientError.js';
import { isUserMemberOfWorkspace } from './workspaceService.js';

export const getChannelByIdService = async (channelId, userId) => {
    try {
        const channel = await channelRepository.getChannelWithWorkspaceDetails(channelId);

        console.log('Fetched channel:', channel);
        if (!channel || !channel.workspaceId) {
            throw new ClientError({
                message: 'channel not found with the provided ID',
                explanation: 'Invalid data sent from the client',
                statusCode: StatusCodes.NOT_FOUND
            });
        }

        const isUserPartOfWorkspace = isUserMemberOfWorkspace(channel.workspaceId, userId);
        if(!isUserPartOfWorkspace) {
            throw new ClientError({
                message: 'User is not a member of the workspace containing this channel',
                explanation: 'User is not authorized to access this channel',
                statusCode: StatusCodes.UNAUTHORIZED
            });
        }

        const messages = await messageRepository.getPaginatedMessages(
            {
                channelId
            },
            1,
            20
        );
        return {
            messages,
            _id: channel._id,
            name: channel.name,
            createdAt: channel.createdAt,
            updatedAt: channel.updatedAt,
            workspaceId: channel.workspaceId
        };
    } catch (error) {
        console.log('Error fetching channel by ID:', error);
        throw error;
    }
}