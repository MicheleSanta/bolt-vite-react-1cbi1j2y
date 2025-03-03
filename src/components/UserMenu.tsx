import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  userEmail: string;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ userEmail, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      // First try to get the custom user data
      const { data: customUser, error: customError } = await supabase
        .from('users_custom')
        .select('role')
        .eq('id', user.id)
        .single();

      if (customError) {
        // If the custom user doesn't exist, create it
        if (customError.code === 'PGRST116') {
          const { data: newCustomUser, error: createError } = await supabase
            .from('users_custom')
            .insert([{
              id: user.id,
              email: user.email,
              role: user.user_metadata?.role || 'user',
              attivo: true
            }])
            .select('role')
            .single();

          if (createError) throw createError;
          if (newCustomUser) {
            setUserRole(newCustomUser.role);
          }
        } else {
          throw customError;
        }
      } else if (customUser) {
        setUserRole(customUser.role);
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
      // Fallback to default role
      setUserRole('user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      onLogout();
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-white">
        <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center animate-pulse">
          <User className="w-5 h-5 text-white opacity-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-white hover:text-blue-200 focus:outline-none"
      >
        <div className={`w-8 h-8 rounded-full ${userRole === 'admin' ? 'bg-purple-500' : 'bg-blue-500'} flex items-center justify-center`}>
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium">{userEmail}</div>
          <div className="text-xs text-blue-200">{userRole === 'admin' ? 'Amministratore' : 'Utente'}</div>
        </div>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
            <p className={`text-xs ${userRole === 'admin' ? 'text-purple-600' : 'text-blue-600'}`}>
              {userRole === 'admin' ? 'Amministratore' : 'Utente'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4 mr-2 text-gray-500" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;