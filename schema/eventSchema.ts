import { z } from 'zod';

export const eventSchema = z.object({
  name: z.string()
    .min(5, { message: "Event name must be at least 5 characters long" })
    .max(50, { message: "Event name must be at most 50 characters long" }),
  description: z.string()
    .max(300, { message: "Event description must be at most 300 characters long" }),
  eventEndDate: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      if (Number.isNaN(date.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      return date >= today;
    }, { message: "End date must be today or in the future" }),
  eventEndTime: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const [hours, minutes] = val.split(":").map(Number);
      return Number.isFinite(hours) && Number.isFinite(minutes);
    }, { message: "Invalid end time" }),
  responsesLimit: z.number()
    .min(1, { message: "Responses limit must be at least 1" })
    .max(10000, { message: "Responses limit must be at most 10000" })
    .optional(),
}).superRefine((data, ctx) => {
  if (!data.eventEndTime) return;

  const now = new Date();
  const [hours, minutes] = data.eventEndTime.split(":").map(Number);
  const endDate = data.eventEndDate ? new Date(data.eventEndDate) : new Date();

  if (Number.isNaN(endDate.getTime())) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDay = new Date(endDate);
  endDay.setHours(0, 0, 0, 0);

  const combined = new Date(endDate);
  combined.setHours(hours, minutes, 0, 0);

  // Only enforce time-in-future when end date is today (or no date provided)
  if (endDay.getTime() === today.getTime() && combined <= now) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['eventEndTime'],
      message: 'End time must be in the future',
    });
  }
});