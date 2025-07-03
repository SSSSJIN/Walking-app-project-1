import React, { useState, useRef } from 'react';
import { View, Button, Text, ScrollView, StyleSheet, Dimensions, TextInput, Alert, Platform } from 'react-native';
import MapView, { Marker, Polyline, MapEvent } from 'react-native-maps';
import { captureRef } from 'react-native-view-shot';
import PathService from '../../../services/PathService';

export default function PingScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [pathName, setPathName] = useState('');
  const mapRef = useRef<MapView>(null);

  // 지도 클릭 시 좌표 추가
  const handleMapPress = (e: MapEvent) => {
    if (isRecording && e.nativeEvent?.coordinate) {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setCoordinates(prev => [...prev, { latitude, longitude }]);
    }
  };

  // 기록 초기화
  const resetRecording = () => {
    setCoordinates([]);
    setPathName('');
    Alert.alert('초기화 완료', '모든 기록이 삭제되었습니다.');
  };

  // 거리 계산 (Haversine 공식)
  const calculateDistance = (points: { latitude: number; longitude: number }[]) => {
    if (points.length < 2) return 0;
    const R = 6371;
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const dLat = ((curr.latitude - prev.latitude) * Math.PI) / 180;
      const dLon = ((curr.longitude - prev.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((prev.latitude * Math.PI) / 180) *
          Math.cos((curr.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += R * c;
    }
    return Number(total.toFixed(2));
  };

  // 시간 계산 (기본 보행 속도 3km/h)
  const calculateTime = (points: { latitude: number; longitude: number }[], speedKmh = 3) => {
    const distance = calculateDistance(points);
    const hours = distance / speedKmh;
    return Number((hours * 60).toFixed(1));
  };

  // 지도 스냅샷 캡처 함수
  const capturePathImage = async (): Promise<string | null> => {
    try {
      if (!mapRef.current) return null;
      const uri = await captureRef(mapRef.current, {
        format: 'png',
        quality: 0.8,
      });
      return uri;
    } catch (error) {
      console.error('이미지 캡처 실패:', error);
      return null;
    }
  };

  // DB 저장 (이미지 포함)
  const saveToDatabase = async () => {
    if (coordinates.length < 2) {
      Alert.alert('경고', '최소 2개 이상의 좌표가 필요합니다.');
      return;
    }
    try {
      // 1. 좌표 변환
      const transformedCoordinates = coordinates.map((point, index) => ({
        lat: point.latitude,
        lng: point.longitude,
        type: index === 0 ? 'START' : index === coordinates.length - 1 ? 'END' : 'WAYPOINT',
        order: index + 1,
      }));

      // 2. 지도 이미지 캡처
      const imageUri = await capturePathImage();

      // 3. FormData 구성
      const formData = new FormData();
      formData.append('pathName', pathName || '무제 경로');
      formData.append('coordinates', JSON.stringify(transformedCoordinates));
      formData.append('totalDistance', calculateDistance(coordinates).toString());
      formData.append('estimatedTime', calculateTime(coordinates).toString());
      if (imageUri) {
        formData.append('pathImage', {
          uri: imageUri,
          type: 'image/png',
          name: 'path.png',
        } as any);
      }

      // 4. 서버 전송
      const response = await fetch('http://10.0.2.2:3000/api/paths/save-gps-record', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        Alert.alert('저장 성공', '경로와 이미지가 저장되었습니다.');
        setCoordinates([]);
        setPathName('');
      }
    } catch (error: any) {
      Alert.alert('저장 실패', error.message || '알 수 없는 오류');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        onPress={handleMapPress}
        initialRegion={{
          latitude: 37.5665,
          longitude: 126.9780,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {coordinates.map((coord, idx) => (
          <Marker key={idx} coordinate={coord} />
        ))}
        {coordinates.length > 1 && (
          <Polyline coordinates={coordinates} strokeColor="#3498db" strokeWidth={4} />
        )}
      </MapView>
      <View style={styles.buttonContainer}>
        <Button
          title={isRecording ? '기록 중지' : '기록 시작'}
          onPress={() => setIsRecording(!isRecording)}
        />
        {!isRecording && coordinates.length > 0 && (
          <>
            <Button title="기록 초기화" onPress={resetRecording} color="#e74c3c" />
            <Button title="DB 저장" onPress={saveToDatabase} color="#2ecc71" />
            <TextInput
              style={styles.input}
              placeholder="경로 이름 입력"
              value={pathName}
              onChangeText={setPathName}
            />
          </>
        )}
      </View>
      <ScrollView style={styles.listContainer}>
        <Text style={styles.listTitle}>기록된 좌표 ({coordinates.length}개)</Text>
        {coordinates.map((c, idx) => (
          <Text key={idx} style={styles.coordText}>
            {idx + 1}. 위도: {c.latitude.toFixed(6)}, 경도: {c.longitude.toFixed(6)}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 2, width: Dimensions.get('window').width },
  buttonContainer: { margin: 10, gap: 10 },
  listContainer: { flex: 0.3, padding: 10 },
  listTitle: { fontWeight: 'bold', marginBottom: 5 },
  coordText: { fontSize: 14, marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    marginVertical: 5,
  },
});
