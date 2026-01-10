"use client";
import { verifySchema } from '@/schema/verifySchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from "sonner"
import axios, { AxiosError } from 'axios';
import { ApiResponse } from '@/types/ApiResponse';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const verifyAccount = () => {
    const router = useRouter();
    const params = useParams<{ username: string }>();

    const form = useForm<z.infer<typeof verifySchema>>({
        resolver: zodResolver(verifySchema)
    });

    const onSubmit = async (data: z.infer<typeof verifySchema>) => { 
        try {
            const response = await axios.post('/api/verify-code', {
                username: params.username,
                verificationToken: data.verificationToken
            });
            toast.success(response.data.message);
            router.replace('/sign-in');

        } catch (error) {
            console.error('Error during sign-up:', error);

            const axiosError = error as AxiosError<ApiResponse>;

            toast.error(axiosError.response?.data.message ?? "Sign up failed. Please try again.");
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen text-black dark:text-gray-500">
      <div className="w-full max-w-lg p-8 space-y-8 bg-white dark:bg-neutral-800 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
            Verify Your Account
          </h1>
          <p className="mb-4">Enter the verification code sent to your email</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              name="verificationToken"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <Input {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className='cursor-pointer'>Verify</Button>
          </form>
        </Form>
      </div>
    </div>
    )
}

export default verifyAccount