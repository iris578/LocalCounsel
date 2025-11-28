import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = { index: '📁', search: '🔍', settings: '⚙️' };
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icons[name] || '📄'}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#111', borderTopColor: '#222', borderTopWidth: 1, paddingTop: 8, paddingBottom: 8, height: 60 },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Matters', headerShown: false, tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Search', headerShown: false, tabBarIcon: ({ focused }) => <TabIcon name="search" focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', headerShown: false, tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: { alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 20, opacity: 0.5 },
  tabIconFocused: { opacity: 1 },
});
