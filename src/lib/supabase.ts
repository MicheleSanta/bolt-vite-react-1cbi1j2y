import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});

// Function to create the initial admin user
export const createAdminUser = async () => {
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'admin123456'
    });
    
    if (signInData.user) {
      // Check if user exists in users_custom
      const { data: customUser, error: customError } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', signInData.user.id)
        .maybeSingle();

      if (!customUser) {
        // Create users_custom record if it doesn't exist
        const { error: insertError } = await supabase
          .from('users_custom')
          .insert([{
            id: signInData.user.id,
            email: 'admin@example.com',
            role: 'admin',
            nome: 'Administrator',
            attivo: true
          }]);

        if (insertError) {
          console.error('Error creating admin custom record:', insertError);
        }
      }
      
      // Sign out after checking/creating
      await supabase.auth.signOut();
      return;
    }

    // If user doesn't exist, create new user
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@example.com',
      password: 'admin123456',
      options: {
        data: {
          role: 'admin',
          nome: 'Administrator'
        }
      }
    });

    if (error) {
      console.error('Error creating admin user:', error);
      return;
    }

    // Create users_custom record
    const { error: upsertError } = await supabase
      .from('users_custom')
      .insert([{
        id: data.user?.id,
        email: 'admin@example.com',
        role: 'admin',
        nome: 'Administrator',
        attivo: true
      }]);

    if (upsertError) {
      console.error('Error creating admin custom record:', upsertError);
    }
  } catch (error) {
    console.error('Error in admin user creation process:', error);
  }
};

// Function to check session
export const checkSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error checking session:', error);
    return null;
  }
};

// Function to get user role
export const getUserRole = async (userId: string): Promise<string> => {
  try {
    // First try to get role from RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_role');
    
    if (!rpcError && rpcData) {
      return rpcData;
    }

    // Fallback to direct query if RPC fails
    const { data, error } = await supabase
      .from('users_custom')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user role:', error);
      return 'user';
    }

    if (!data) {
      // If no custom record exists, create one with default role
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user) {
        const { error: insertError } = await supabase
          .from('users_custom')
          .insert([{
            id: userId,
            email: authUser.user.email,
            role: 'user',
            attivo: true
          }]);

        if (insertError) {
          console.error('Error creating user custom record:', insertError);
        }
      }
      return 'user';
    }

    return data.role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
};