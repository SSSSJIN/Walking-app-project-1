import React, { useEffect, useRef, useState } from 'react';
import { View, Button, Alert, Text, ScrollView, StyleSheet, TextInput, Platform } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { captureRef } from 'react-native-view-shot';
import PathService from '../../../services/PathService'; // 서비스 경로 확인

type LatLng = { latitude: number; longitude: number };

export default function GpsScreen() {
  const [recording, setRecording] = useState(false);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null);
  const [pathName, setPathName] = useState(''); // 경로 이름 상태 추가
  const mapRef = useRef<MapView>(null);
  const watchRef = useRef<Location.LocationSubscription>();

  // 위치 권한 요청
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 오류', '위치 권한이 필요합니다.');
        return;
      } // 🔴 누락된 닫는 괄호 추가
      const location = await Location.getLastKnownPositionAsync();
      if (location) {
        setCurrentPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    })();
  }, []);

  // 위치 변화 감지 시작
  const startRecording = async () => {
    setRecording(true);
    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
      },
      (position) => {
        const newPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCurrentPosition(newPoint);
        setRoute((prev) => [...prev, newPoint]);
        mapRef.current?.animateCamera({
          center: newPoint,
          zoom: 16,
        });
      }
    );
  };

  // 기록 중지 및 초기화
  const stopRecording = () => {
    if (watchRef.current) {
      watchRef.current.remove();
    }
    setRecording(false);
  };

  // 기록 초기화
  const resetRecording = () => {
    setRoute([]);
    Alert.alert('초기화 완료', '모든 기록이 삭제되었습니다.');
  };

  // 거리 계산 (예시)
  const calculateDistance = (points: LatLng[]): number => {
    if (points.length < 2) return 0;

    const R = 6371; // 지구 반지름(km)
    let totalDistance = 0;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const current = points[i];

      const dLat = radians(current.latitude - prev.latitude);
      const dLon = radians(current.longitude - prev.longitude);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(radians(prev.latitude)) *
        Math.cos(radians(current.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }

    return Number(totalDistance.toFixed(2)); // 소수점 2자리까지
  };

  // 각도 → 라디안 변환 함수
  const radians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  // 시간 계산 함수 (기본 보행 속도 3km/h 기준)
  const calculateTime = (points: LatLng[], speedKmh: number = 3): number => {
    const distance = calculateDistance(points);
    const hours = distance / speedKmh;
    return Number((hours * 60).toFixed(1)); // 분 단위로 변환
  };

  const capturePathImage = async (): Promise<string | null> => {
    try {
      const uri = await captureRef(mapRef, {
        format: 'png',
        quality: 0.8,
      });
      return uri;
    } catch (error) {
      console.error('이미지 캡처 실패:', error);
      return null;
    }
  };

  // 2. 저장 함수 수정 (이미지 업로드 로직 추가)
  const saveToDatabase = async () => {
    if (route.length < 2) {
      Alert.alert('경고', '최소 2개 이상의 좌표가 필요합니다.');
      return;
    }

    try {
      // 1. 좌표 데이터 형식 변환 (latitude → lat, longitude → lng)
      const transformedCoordinates = route.map(point => ({
        lat: point.latitude,
        lng: point.longitude,
        type: 'WAYPOINT' // 또는 START/END 지정
      }));

      // 2. FormData에 변환된 좌표 추가
      const formData = new FormData();
      formData.append('pathName', pathName || '무제 경로');
      formData.append('coordinates', JSON.stringify(transformedCoordinates)); // ✅ key 변경
      formData.append('totalDistance', calculateDistance(route).toString());
      formData.append('estimatedTime', calculateTime(route).toString());

      // 3. 이미지 추가
      const imageUri = await capturePathImage();
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
        setRoute([]);
        setPathName('');
      }
    } catch (error) {
      Alert.alert('저장 실패', error instanceof Error ? error.message : '알 수 없는 오류');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <Button
          title={recording ? '기록 중지' : '기록 시작'}
          onPress={recording ? stopRecording : startRecording}
        />
        {!recording && route.length > 0 && (
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

      {currentPosition && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            ...currentPosition,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {route.map((point, index) => (
            <Marker
              key={index}
              coordinate={point}
              title={index === 0 ? '시작점' : index === route.length - 1 ? '도착점' : `경유지 ${index}`}
            />
          ))}
          {route.length > 1 && (
            <Polyline
              coordinates={route}
              strokeColor="#3498db"
              strokeWidth={4}
            />
          )}
        </MapView>
      )}

      <ScrollView style={styles.routeList}>
        <Text style={styles.routeTitle}>기록된 좌표 ({route.length}개)</Text>
        {route.map((point, idx) => (
          <Text key={idx} style={styles.routeItem}>
            {idx + 1}. 위도: {point.latitude.toFixed(6)}, 경도: {point.longitude.toFixed(6)}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { flex: 2 },
  controls: { padding: 16, gap: 10 },
  routeList: { flex: 0.3, padding: 16 },
  routeTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  routeItem: { fontSize: 14, marginBottom: 6 },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 8, 
    marginVertical: 5 
  }
});
