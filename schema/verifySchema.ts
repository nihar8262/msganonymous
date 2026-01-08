import { z } from 'zod';

export const verifySchema = z.object({
    verificationToken: z.string()
    .length(6, { message: "Verification token must be exactly 6 characters long" }),
});