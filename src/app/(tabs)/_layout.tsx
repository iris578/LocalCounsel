import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { theme } from '../../theme/tokens';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = { index: 'H', search: '?', settings: 'S' };
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icons[name] || '?'}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.palette.creamLight,
          borderTopColor: theme.palette.sandBase,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarActiveTintColor: theme.palette.deepBlue,
        tabBarInactiveTintColor: theme.palette.accentGrey,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', color: theme.palette.charcoal },
        headerStyle: { backgroundColor: theme.palette.creamLight },
        headerTintColor: theme.palette.charcoal,
        headerTitleStyle: { fontWeight: '700', color: theme.palette.charcoal },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Matters', headerShown: false, tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} /> }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: 'Search', headerShown: false, tabBarIcon: ({ focused }) => <TabIcon name="search" focused={focused} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', headerShown: false, tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: { alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 16, opacity: 0.55, color: theme.palette.accentGrey },
  tabIconFocused: { opacity: 1, color: theme.palette.deepBlue },
});
