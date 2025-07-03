import React, { useEffect, useRef, useState } from 'react';
import { View, Button, Alert, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';

const TMAP_API_KEY = 'Qgn1mfMzsx25oDNA5A5bfCPhL9JQbY21Xc6P69Qb'; // 실제 TMAP API KEY로 변경

type LatLng = { latitude: number; longitude: number };

export default function App() {
  const [recording, setRecording] = useState(false);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null);
  const [showRouteList, setShowRouteList] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  // 최초 실행 시 현재 위치 받아오기
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 오류', '위치 권한이 필요합니다.');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setCurrentPosition({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();

    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
    };
  }, []);

  // 중복 좌표(연속) 방지 함수
  const isSameLocation = (a: LatLng, b: LatLng) =>
    Math.abs(a.latitude - b.latitude) < 0.00001 &&
    Math.abs(a.longitude - b.longitude) < 0.00001;

  // 경로 기록 시작
  const startRecording = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 오류', '위치 권한이 필요합니다.');
      return;
    }

    setRoute([]);
    setShowRouteList(false);
    setRecording(true);

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 5,
      },
      (position) => {
        const { latitude, longitude } = position.coords;
        setRoute((prev) => {
          if (
            prev.length === 0 ||
            !isSameLocation(prev[prev.length - 1], { latitude, longitude })
          ) {
            return [...prev, { latitude, longitude }];
          }
          return prev;
        });
      }
    );
  };

  // 경로 기록 중지
  const stopRecording = () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setRecording(false);
    setShowRouteList(true);
  };

  // TMap 지도 및 경로를 표시하는 HTML
  const tmapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <script src="https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${TMAP_API_KEY}"></script>
    </head>
    <body>
      <div id="map" style="width:100vw;height:100vh"></div>
      <script>
        var map = new Tmapv2.Map("map", {
          center: new Tmapv2.LatLng(${currentPosition?.latitude || 37.5665}, ${currentPosition?.longitude || 126.9780}),
          width: "100vw",
          height: "100vh",
          zoom: 15
        });

        ${route.length > 0 ? `
          var polyline = new Tmapv2.Polyline({
            path: [${route.map(p => `new Tmapv2.LatLng(${p.latitude},${p.longitude})`).join(',')}],
            strokeColor: "#FF0000",
            strokeWeight: 3,
            map: map
          });
        ` : ''}
      </script>
    </body>
    </html>
  `;

  return (
    <View style={{ flex: 1 }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: tmapHtml }}
        style={{ flex: 1 }}
      />
      <View style={styles.controls}>
        <Button
          title={recording ? "기록 중지" : "기록 시작"}
          onPress={recording ? stopRecording : startRecording}
        />
      </View>
      {showRouteList && (
        <ScrollView style={styles.routeList}>
          <Text style={styles.routeTitle}>기록된 좌표 목록</Text>
          {route.length === 0 ? (
            <Text style={styles.routeItem}>기록된 좌표가 없습니다.</Text>
          ) : (
            route.map((point, idx) => (
              <Text style={styles.routeItem} key={idx}>
                {idx + 1}. 위도: {point.latitude}, 경도: {point.longitude}
              </Text>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { padding: 16, backgroundColor: '#fff' },
  routeList: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  routeTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
  },
  routeItem: {
    fontSize: 14,
    marginBottom: 2,
  },
});
