'use client'

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from './ui/button';
import { User } from 'next-auth';
import { useTheme } from 'next-themes';
import { Moon, Sun, UserCircle } from 'lucide-react';
import Image from 'next/image';

function Navbar() {
  const { data: session } = useSession();
  const user : User | undefined = session?.user as User || undefined;
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className="p-2 fixed w-full md:p-3 shadow-md bg-white/20 dark:bg-gray-900/20 backdrop-blur-md text-black dark:text-white z-50">
      <div className="container mx-auto  flex flex-row justify-between items-center">
        <a href="#" className="text-xl  font-bold md:mb-0">
          True Feedback
        </a>
        <div className="flex items-center gap-4">
          {session ? (
            <>
               <div className="flex items-center gap-3">
                {/* Profile Image */}
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.username || 'User'}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-gray-300 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <UserCircle className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
                
                {/* Username */}
                <span className="mr-2 font-bold text-lg hidden md:block">
                  {user?.username || user?.email}
                </span>
              </div>
              <Button onClick={() => signOut()} className="w-[20vw] md:w-auto bg-slate-100  cursor-pointer" variant='outline'>
                Logout
              </Button>
            </>
          ) : (
            <Link href="/sign-in">
              <Button className="w-full md:w-auto cursor-pointer " variant={'outline'}>Login</Button>
            </Link>
          )}
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="icon"
            className="cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;