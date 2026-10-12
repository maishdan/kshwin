import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from '@/components/auth-form';
import { pageHead } from '@/lib/site';
export const Route=createFileRoute('/')({head:()=>pageHead('Sign in','Your world of virtual trading and casino play. Sign in to Verve.'),component:AuthForm});
