import { StatusCodes } from "http-status-codes";

import userRepository from "../repositories/userRepository.js";
import workspaceRepository from "../repositories/workspaceRepository.js"
import ClientError from "../utils/errors/clientError.js";
import { isUserMemberOfWorkspace } from "./workspaceService.js";

export const isMemberPartOfWorkspaceService = async (workspaceId, memberId) => {
    const workspace = await workspaceRepository.getById(workspaceId);

    if(!workspace) {
        throw new ClientError({
            explanation: 'Workspace does not exist',
            message: 'Workspace does not exist',
            statusCode: StatusCodes.NOT_FOUND
        });
    }

    const isUserMember = isUserMemberOfWorkspace(workspace, memberId);

    if(!isUserMember) {
        throw new ClientError({
            explanation: 'User is not a member of the workspace',
            message: 'User is not a member of the workspace',
            statusCode: StatusCodes.UNAUTHORIZED
        });
    }
    const user = await userRepository.getById(memberId);
    return user;
}