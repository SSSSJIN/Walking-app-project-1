import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Link href="/history/gps" style={styles.button}>
        <Text style={styles.buttonText}>GPS 기록</Text>
      </Link>
      <Link href="/history/ping" style={styles.button}>
        <Text style={styles.buttonText}>직접 기록</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  button: {
    padding: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    minWidth: 150,
    alignItems: 'center'
  },
  buttonText: { fontSize: 18 }
});
