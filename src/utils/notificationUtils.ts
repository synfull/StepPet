import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permissions and register for push notifications
export const registerForPushNotifications = async () => {
  try {
    console.log('Starting push notification registration...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Existing notification status:', existingStatus);
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('New notification status:', status);
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    console.log('Getting Expo push token...');
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token received:', token);
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.log('No user session found');
      return;
    }
    
    console.log('Updating push token in Supabase...');
    // Update the user's push token in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', session.user.id);
      
    if (error) {
      console.error('Error updating push token:', error);
    } else {
      console.log('Push token updated successfully');
    }
    
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
  }
};

export const sendNotification = async (
  userId: string,
  type: 'friend' | 'pet' | 'system',
  title: string,
  message: string,
  data?: any
) => {
  try {
    // First, try to get the user's push token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (profileError) {
      // If the error is because the column doesn't exist, log it and continue
      if (profileError.code === '42703') {
        console.log('Push token column not found, skipping notification');
      } else {
        console.error('Error getting push token:', profileError);
      }
    }

    // Store the notification in the database regardless
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          type,
          title,
          message,
          data,
          read: false,
        },
      ]);

    if (notificationError) {
      console.error('Error storing notification:', notificationError);
      return;
    }

    // Only send push notification if we have a valid push token
    if (profile?.push_token) {
      const pushMessage = {
        to: profile.push_token,
        sound: 'default',
        title,
        body: message,
        data,
      };

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pushMessage),
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const sendFriendRequestNotification = async (
  userId: string,
  fromUsername: string
) => {
  await sendNotification(
    userId,
    'friend',
    'New Friend Request',
    `${fromUsername} wants to be friends!`,
    { fromUsername }
  );
};

export const sendPetCheckInNotification = async (
  userId: string,
  petName: string
) => {
  await sendNotification(
    userId,
    'pet',
    'Time to Check In!',
    `${petName} misses you! Come back and check on your pet.`,
    { petName }
  );
};

export const sendFriendRequestAcceptedNotification = async (
  userId: string,
  friendUsername: string
) => {
  await sendNotification(
    userId,
    'friend',
    'Friend Request Accepted',
    `${friendUsername} accepted your friend request!`,
    { friendUsername }
  );
};

export const sendEggHatchingNotification = async (userId: string, petName: string) => {
  return sendNotification(
    userId,
    'pet',
    'Egg Ready to Hatch',
    `Your egg is ready to hatch! Tap to meet ${petName}!`,
    { type: 'egg_hatching' }
  );
}; 