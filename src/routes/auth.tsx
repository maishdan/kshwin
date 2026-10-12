import {createFileRoute} from '@tanstack/react-router';
import {AuthForm} from '@/components/auth-form';
import {pageHead} from '@/lib/site';
export const Route=createFileRoute('/auth')({head:()=>pageHead('Your account','Sign in or create your Verve account for virtual play and trading.'),component:AuthForm});
