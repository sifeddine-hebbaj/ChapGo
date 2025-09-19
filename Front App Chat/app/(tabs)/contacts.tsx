import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import ContactItem from '@/components/ContactItem';
import HeaderBar from '@/components/HeaderBar';
import { colors, spacing, borderRadius, shadows } from '@/styles/globalStyles';
import { Contact } from '@/types';
import { useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { getToken, clearToken } from '@/lib/auth';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }
      try {
        const items = await apiGet<any[]>(`/api/contacts`);
        const mapped: Contact[] = items.map((u) => ({
          id: String(u.id),
          name: u.name,
          email: u.email,
          avatar: u.avatar ?? 'https://placehold.co/100x100',
          isOnline: !!u.online,
        }));
        setContacts(mapped);
      } catch (e) {
        console.warn('Failed to load contacts', e);
        const msg = (e as Error)?.message || '';
        if (msg.includes('401') || msg.includes('403')) {
          router.replace('/(auth)/login');
        } else {
          Alert.alert('Erreur', 'Impossible de charger les contacts');
        }
      }
    })();
  }, []);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactPress = async (contact: Contact) => {
    try {
      const res = await apiPost<{ id: number }>(`/api/conversations/with/${contact.id}`, {});
      router.push({ pathname: '/conversation/[id]', params: { id: String(res.id) } });
    } catch (e) {
      console.warn('Failed to open/create conversation', e);
      Alert.alert('Erreur', "Impossible d'ouvrir la conversation");
    }
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <ContactItem
      contact={item}
      onPress={() => handleContactPress(item)}
    />
  );

  return (
    <View style={styles.container}>
      <HeaderBar 
        title="Contacts"
        showLogoutButton
        onLogoutPress={async () => { await clearToken(); router.replace('/(auth)/login'); }}
      />
      
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, shadows.sm]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un contact..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  listContainer: {
    paddingVertical: spacing.sm,
  },
});