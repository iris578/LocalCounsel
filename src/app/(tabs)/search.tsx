import { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Keyboard, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchMeetings } from '../../services/embeddings';
import { db } from '../../services/database';
import { theme } from '../../theme/tokens';

interface SearchResultItem {
  meetingId: string;
  matterName: string;
  meetingDate: Date;
  snippet: string;
  relevanceScore: number;
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    setSearching(true);
    setHasSearched(true);
    try {
      const searchResults = await searchMeetings(query, 10);
      const enrichedResults: SearchResultItem[] = await Promise.all(
        searchResults.map(async (r) => {
          const meeting = await db.getMeeting(r.meetingId);
          let matterName = 'Unknown Matter';
          if (meeting) {
            const matter = await db.getMatter(meeting.matterId);
            if (matter) matterName = matter.name;
          }
          return {
            meetingId: r.meetingId,
            matterName,
            meetingDate: meeting?.recordedAt ? new Date(meeting.recordedAt) : new Date(),
            snippet: r.chunk,
            relevanceScore: r.score,
          };
        })
      );
      setResults(enrichedResults);
    } catch (err) {
      console.error('Search failed:', err);
    }
    setSearching(false);
  };

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>Find anything in your meetings</Text>
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>?</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="What did the client say about..."
            placeholderTextColor={theme.palette.accentGrey}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setResults([]);
                setHasSearched(false);
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>x</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchButton, !query.trim() && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={!query.trim() || searching}
        >
          {searching ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.searchButtonText}>Search</Text>}
        </TouchableOpacity>
      </View>
      {!hasSearched && (
        <View style={styles.examplesContainer}>
          <Text style={styles.examplesTitle}>Try searching for:</Text>
          {['contract signing date', 'witness names', 'damages discussed', 'email evidence'].map((example) => (
            <TouchableOpacity key={example} style={styles.exampleChip} onPress={() => setQuery(example)}>
              <Text style={styles.exampleText}>{example}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <FlatList
        data={results}
        keyExtractor={(item, index) => `${item.meetingId}-${index}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultCard}
            onPress={() => router.push({ pathname: '/meeting/[id]', params: { id: item.meetingId } })}
          >
            <View style={styles.resultHeader}>
              <Text style={styles.resultMatter}>{item.matterName}</Text>
              <Text style={styles.resultScore}>{Math.round(item.relevanceScore * 100)}% match</Text>
            </View>
            <Text style={styles.resultSnippet} numberOfLines={3}>
              "{item.snippet}"
            </Text>
            <Text style={styles.resultDate}>{formatDate(item.meetingDate)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          hasSearched && !searching ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsIcon}>:/</Text>
              <Text style={styles.noResultsText}>No results found</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.resultsList}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>Search powered by on-device AI</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.palette.lilacMist },
  header: { padding: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  title: { fontSize: 28, fontWeight: '700', color: theme.palette.charcoal },
  subtitle: { fontSize: 14, color: theme.palette.accentGrey, marginTop: 4 },
  searchContainer: { flexDirection: 'row', paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md, gap: 10 },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.palette.sandBase,
    borderRadius: theme.radii.xl,
    paddingHorizontal: theme.spacing.md,
  },
  searchIcon: { fontSize: 16, marginRight: 10, color: theme.palette.accentGrey },
  searchInput: { flex: 1, paddingVertical: 14, color: theme.palette.charcoal, fontSize: 16 },
  clearButton: { padding: 6 },
  clearButtonText: { color: theme.palette.accentGrey, fontSize: 16 },
  searchButton: {
    backgroundColor: theme.palette.deepBlue,
    borderRadius: theme.radii.xl,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 96,
  },
  searchButtonDisabled: { backgroundColor: theme.palette.accentGrey },
  searchButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  examplesContainer: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg },
  examplesTitle: { color: theme.palette.accentGrey, fontSize: 14, marginBottom: 12 },
  exampleChip: {
    backgroundColor: theme.palette.creamLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.radii.xl,
    marginBottom: 10,
    ...theme.shadows.soft,
  },
  exampleText: { color: theme.palette.charcoal, fontSize: 15 },
  resultsList: { padding: theme.spacing.lg, paddingBottom: 100 },
  resultCard: { backgroundColor: theme.palette.creamLight, borderRadius: theme.radii.xl, padding: theme.spacing.lg, marginBottom: 12, ...theme.shadows.soft },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  resultMatter: { color: theme.palette.charcoal, fontSize: 14, fontWeight: '700' },
  resultScore: { color: theme.palette.olive, fontSize: 12, fontWeight: '700' },
  resultSnippet: { color: theme.palette.charcoal, fontSize: 14, lineHeight: 20, fontStyle: 'italic', marginBottom: 10 },
  resultDate: { color: theme.palette.accentGrey, fontSize: 12 },
  noResults: { alignItems: 'center', paddingTop: 60 },
  noResultsIcon: { fontSize: 32, marginBottom: 16, opacity: 0.6, color: theme.palette.accentGrey },
  noResultsText: { color: theme.palette.charcoal, fontSize: 18, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 70, alignSelf: 'center' },
  footerText: { color: theme.palette.accentGrey, fontSize: 12 },
});
