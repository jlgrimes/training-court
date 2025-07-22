'use client';

import { useCallback, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createClient } from "@/utils/supabase/client";
import { EditIcon } from "lucide-react";
import { useUserData } from "@/hooks/user-data/useUserData";
import { useRouter } from "next/navigation";

export const ScreenNameEditable = ({ userId }: { userId: string }) => {
  const { data: userData, mutate } = useUserData(userId);
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [screenNameValue, setScreenNameValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const upsertScreenName = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // First, ensure the user record exists
      if (!userData) {
        console.log('Creating new user record...');
        const { error: insertError } = await supabase
          .from('user data')
          .insert({ 
            id: userId,
            live_screen_name: screenNameValue 
          });
          
        if (insertError && insertError.code !== '23505') { // 23505 is unique violation
          throw insertError;
        }
      }
      
      // Now update the screen name
      const { error } = await supabase
        .from('user data')
        .update({ 
          live_screen_name: screenNameValue 
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update the local data immediately
      await mutate();
      
      // Close the edit mode
      setIsEditing(false);
      
      // Only redirect to home if this is the first time setting the screen name
      if (!userData?.live_screen_name) {
        router.push('/home');
      }
    } catch (error) {
      console.error('Error updating screen name:', error);
      alert('Error saving screen name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [screenNameValue, userId, userData, mutate, router]);

  if (isEditing || !userData?.live_screen_name) {
    return (
      <div className="flex w-full max-w-sm items-center space-x-2 gap-2">
        <Input 
          autoFocus 
          value={screenNameValue} 
          onChange={(e) => setScreenNameValue(e.target.value)} 
          placeholder="PTCG Live screen name" 
          disabled={isLoading}
        />
        <Button 
          disabled={screenNameValue.length === 0 || isLoading} 
          onClick={() => upsertScreenName()}
        >
          {isLoading ? 'Saving...' : 'Submit'}
        </Button>
        {isEditing && userData?.live_screen_name && (
          <Button 
            variant="ghost" 
            onClick={() => {
              setIsEditing(false);
              setScreenNameValue('');
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </div>
    )
  }

  return <div className="flex items-center gap-1">
    <h2 className="text-xl tracking-wide font-semibold">{userData.live_screen_name}</h2>
    <Button 
      onClick={() => {
        setIsEditing(true);
        setScreenNameValue(userData.live_screen_name || '');
      }} 
      size='icon' 
      variant='ghost'
    >
      <EditIcon className="h-4 w-4 stroke-muted-foreground" />
    </Button>
  </div>
}