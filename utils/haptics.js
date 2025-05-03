import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Utility class for providing haptic feedback throughout the app
 * Uses expo-haptics under the hood
 */
export const HapticFeedback = {
  /**
   * Light impact feedback - for small interactions
   */
  light: () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }
  },

  /**
   * Medium impact feedback - for standard button presses
   */
  medium: () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }
  },

  /**
   * Heavy impact feedback - for more substantial interactions
   */
  heavy: () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }
  },

  /**
   * Success notification feedback
   */
  success: () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }
  },

  /**
   * Warning notification feedback
   */
  warning: () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }
  },

  /**
   * Error notification feedback
   */
  error: () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }
  },

  /**
   * Selection feedback for touches/taps
   */
  selection: () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }
  }
};

export default HapticFeedback;