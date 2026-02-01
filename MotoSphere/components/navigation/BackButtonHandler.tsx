// navigation/BackButtonHandler.tsx
import React from 'react';
import { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export const useExitConfirmation = () => {
  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            {
              text: 'No',
              onPress: () => null,
              style: 'cancel',
            },
            {
              text: 'Yes',
              onPress: () => BackHandler.exitApp(),
              style: 'destructive',
            },
          ]
        );
        return true; // Prevent default back behavior
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => backHandler.remove();
    }, [])
  );
};