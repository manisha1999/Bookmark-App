import type { AuthError, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export type SignUpInput = {
  email: string;
  password: string;
};

export type SignUpResult = {
  user: User | null;
  error: AuthError | null;
};

export const signUpAccount = async ({
  email,
  password,
}: SignUpInput): Promise<SignUpResult> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return {
    user: data.user,
    error,
  };
};