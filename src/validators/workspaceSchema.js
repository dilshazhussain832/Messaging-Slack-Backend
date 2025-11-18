import {z} from 'zod';

export const createworkspaceSchema = z.object({
    name: z.string().min(3).max(50)
});