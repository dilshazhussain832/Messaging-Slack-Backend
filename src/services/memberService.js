import { StatusCodes } from "http-status-codes";
import workspaceRepository from "../repositories/workspaceRepository.js"
import ClientError from "../utils/errors/clientError.js";
import { isUserMemberOfWorkspace } from "./workspaceService.js";
import userRepository from "../repositories/userRepository.js";

export const isMemberPartOfWorkspaceService = async (workspaceId, memberId) => {
    const workspace = await workspaceRepository.getById(workspaceId);

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