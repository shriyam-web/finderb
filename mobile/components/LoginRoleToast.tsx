import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../constants/typography';
import { useAuth } from '../context/AuthContext';

export function LoginRoleToast() {
  const insets = useSafeAreaInsets();
  const { loginRoleNotice, clearLoginRoleNotice } = useAuth();

  useEffect(() => {
    if (!loginRoleNotice) return;
    const timer = setTimeout(() => clearLoginRoleNotice(), 3000);
    return () => clearTimeout(timer);
  }, [loginRoleNotice, clearLoginRoleNotice]);

  if (!loginRoleNotice) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: insets.top + 12,
        left: 16,
        right: 16,
        zIndex: 100000,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          maxWidth: 360,
          borderRadius: 999,
          backgroundColor: 'rgba(24,24,27,0.92)',
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: '#FFFFFF', textAlign: 'center' }}>
          {loginRoleNotice === 'business' ? 'Logged in as a business' : 'Logged in as a User'}
        </Text>
      </View>
    </View>
  );
}
