import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, Button, H1, Body } from '../components/ui';
import { space } from '../constants/theme';

export default function Placeholder() {
  const router = useRouter();
  return (
    <Screen>
      <View style={{ marginTop: space.xxxl }}>
        <H1>mirror</H1>
        <Card style={{ marginTop: space.lg }}>
          <Body>This screen is built in the next phase.</Body>
        </Card>
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
