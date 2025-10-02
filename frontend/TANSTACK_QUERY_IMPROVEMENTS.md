# TanStack Query Integration - Performance Improvements

## 🚀 What We've Added

### 1. **Automatic Caching & Background Updates**

- **Before**: Manual state management with `useState` and `useEffect`
- **After**: Smart caching with automatic background refetching
- **Benefit**: Data stays fresh without user intervention

### 2. **Optimistic Updates**

- **Purchase Items**: UI updates instantly before server confirmation
- **Delete Items**: Items disappear immediately with rollback on error
- **Create Items**: New items appear instantly in the list

### 3. **Smart Loading States**

- **Global Loading**: Shows spinner for initial data fetch
- **Background Refresh**: Small indicator when refetching in background
- **Mutation Loading**: Button states reflect pending operations

### 4. **Advanced Features**

- **Stale Time**: Data considered fresh for 30s-10min depending on type
- **Cache Time**: Data kept in memory for 10 minutes after last use
- **Automatic Retries**: Failed requests retry automatically
- **Deduplication**: Multiple identical requests are merged

## 📊 Performance Benefits

### Cache Hit Ratio

- Categories, rooms, companies: Cached for 10 minutes (rarely change)
- Items: Cached for 30 seconds (frequently updated)
- Individual items: Cached for 1 minute

### Network Optimization

- Background updates don't block UI
- Failed mutations automatically retry
- Duplicate requests are merged
- Prefetching for instant navigation

### User Experience

- **Instant Feedback**: Optimistic updates make actions feel instant
- **Offline Support**: Cached data works without network
- **Smart Refetching**: Only fetches when data might be stale
- **Error Recovery**: Automatic rollback on failed optimistic updates

## 🛠 Technical Implementation

### Custom Hooks Created

```typescript
// Data fetching
useItems(workspaceId); // Shopping items with auto-refresh
useCategories(workspaceId); // Categories (long cache)
useRooms(workspaceId); // Rooms (long cache)
useCompanies(workspaceId); // Companies (long cache)

// Mutations with optimistic updates
useCreateItem(workspaceId); // Add new items
useUpdateItemPurchased(); // Mark as purchased/unpurchased
useDeleteItem(); // Remove items
```

### Query Configuration

```typescript
{
  staleTime: 30 * 1000,      // 30s for items
  staleTime: 10 * 60 * 1000, // 10min for metadata
  gcTime: 10 * 60 * 1000,    // 10min garbage collection
  retry: 3,                  // Auto-retry failed requests
}
```

## 📈 Before vs After

### Before (Manual State)

```typescript
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchItems().then(setItems);
}, []);

// Manual updates
const handleUpdate = async () => {
  await updateItem();
  const newItems = await fetchItems(); // Refetch everything
  setItems(newItems);
};
```

### After (TanStack Query)

```typescript
const { data: items, isLoading } = useItems(workspaceId);
const updateMutation = useUpdateItem();

// Optimistic updates with automatic error handling
const handleUpdate = () => {
  updateMutation.mutate(data, {
    onMutate: () => {
      /* Optimistic update */
    },
    onError: () => {
      /* Rollback */
    },
    onSettled: () => {
      /* Ensure consistency */
    },
  });
};
```

## 🎯 Key Improvements

1. **Faster perceived performance** - Optimistic updates
2. **Better offline experience** - Smart caching
3. **Reduced server load** - Background updates only when needed
4. **Automatic error handling** - Retries and rollbacks
5. **Simplified code** - No manual state management
6. **Real-time feel** - Instant UI feedback

## 🔧 DevTools Integration

- React Query DevTools available in development
- Real-time cache inspection
- Query invalidation controls
- Performance monitoring

The shopping interface now feels significantly faster and more responsive, especially on slower connections or when the server is under load!
