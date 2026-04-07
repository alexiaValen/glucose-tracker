# Asset Setup for Dashboard Botanical Footer

## Images to save from your uploads:

1. **Leaf plant** (`Untitled_design.png` — the muted green leaf cluster)
   → Save as: `mobile-app/assets/botanical-leaf.png`

2. **Pixel butterfly** (`Untitled_design__1_.png` — purple/teal butterfly on black)
   → Save as: `mobile-app/assets/butterfly-pixel.png`
   → Note: The black background will show. Either:
     a) Export the butterfly with transparent background (PNG with alpha), OR
     b) Use `tintColor` on the Image component if you want to recolor it

## If assets aren't ready yet, swap the BotanicalFooter component to use emoji temporarily:

```tsx
// Temporary fallback — replace with Image once assets are exported
function BotanicalFooter() {
  const floatY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -6, duration: 2200, useNativeDriver: true }),
        Animated.timing(floatY, { toValue:  0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ height: 100, position: 'relative', marginTop: 8 }}>
      <Text style={{ position: 'absolute', bottom: 0, left: SW * 0.18, fontSize: 60, opacity: 0.5 }}>
        🌿
      </Text>
      <Animated.Text style={{
        position: 'absolute', bottom: 40, left: SW * 0.44,
        fontSize: 32,
        transform: [{ translateY: floatY }],
      }}>
        🦋
      </Animated.Text>
    </View>
  );
}
```

## Path reference in DashboardScreen.tsx:
```
require('../../assets/botanical-leaf.png')
require('../../assets/butterfly-pixel.png')
```
Adjust the relative path based on where your screen file lives.