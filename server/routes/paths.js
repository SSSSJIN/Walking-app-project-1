const express = require('express');
const oracledb = require('oracledb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); 
const router = express.Router();

// 1. Multer 설정 (경로 이미지 업로드용)
const uploadDir = path.join(__dirname, '../uploads/paths');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 파일 업로드 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('이미지 파일만 업로드 가능합니다.'));
        }
    }
});

// 2. GPS 기록 저장 핸들러
router.post('/save-gps-record', upload.single('pathImage'), async (req, res) => {
  console.log('업로드된 파일 정보:', req.file);
  let connection;
  try {
    const { pathName, pathDescription, pathTagNo, coordinates, totalDistance, estimatedTime } = req.body;
    const userNo = process.env.TEMP_USER_NO || 1;
    const imageFile = req.file;

    // 좌표 데이터 유효성 검사
    if (!coordinates) {
      return res.status(400).json({ 
        success: false, 
        message: '좌표 데이터가 필요합니다.' 
      });
    }

    const parsedCoordinates = JSON.parse(coordinates);
    if (!Array.isArray(parsedCoordinates) || parsedCoordinates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '유효한 좌표 데이터가 없습니다.' 
      });
    }

    connection = await oracledb.getConnection();

    // 시작점 좌표 검증
    const startPoint = parsedCoordinates.find(coord => coord.type === 'START') || parsedCoordinates[0];
    const startLat = parseFloat(startPoint.lat);
    const startLng = parseFloat(startPoint.lng);

    if (isNaN(startLat) || isNaN(startLng)) {
      throw new Error('유효하지 않은 시작 좌표 값');
    }

    // 이미지 경로 처리
    let imagePath = null;
    if (imageFile) {
      imagePath = `/uploads/paths/${imageFile.filename}`;
    }

    // PATHS 테이블 저장
    const pathResult = await connection.execute(
      `INSERT INTO PATHS 
       (PATH_NO, USER_NO, PATH_NAME, PATH_DESCRIPTION, PATH_TAG_NO, 
        PATH_IMAGE, START_LATITUDE, START_LONGITUDE, TOTAL_DISTANCE, ESTIMATED_TIME)
       VALUES (SEQ_PATHS.NEXTVAL, :userNo, :pathName, :pathDescription, :pathTagNo, 
               :pathImage, :startLat, :startLng, :totalDistance, :estimatedTime)
       RETURNING PATH_NO INTO :pathNo`,
      {
        userNo: parseInt(userNo),
        pathName: pathName || null,
        pathDescription: pathDescription || null,
        pathTagNo: pathTagNo ? parseInt(pathTagNo) : null,
        pathImage: imagePath,
        startLat: startLat,
        startLng: startLng,
        totalDistance: totalDistance ? parseFloat(totalDistance) : null,
        estimatedTime: estimatedTime ? parseFloat(estimatedTime) : null,
        pathNo: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      }
    );

    const pathNo = pathResult.outBinds.pathNo[0];

    // 2. PATH_TYPES 매핑 (경로 타입명 → 번호)
    const typeMapping = await connection.execute(
      'SELECT PATH_TYPE_NO, PATH_TYPE_NAME FROM PATH_TYPES'
    );
    const typeMap = {};
    typeMapping.rows.forEach(row => {
      typeMap[row[1]] = row[0];
    });

    // 3. PATH_DETAILS(경로 상세) 저장
    const pathDetails = parsedCoordinates.map((coord, index) => ({
      pathNo,
      latitude: coord.lat,
      longitude: coord.lng,
      pathTypeNo: typeMap[coord.type] || typeMap['경유지'],
      waypointOrder: coord.order || index + 1,
      pointName: coord.name || null
    }));

    await connection.executeMany(
      `INSERT INTO PATH_DETAILS
        (PATH_DETAIL_NO, PATH_NO, LATITUDE, LONGITUDE, PATH_TYPE_NO, WAYPOINT_ORDER, POINT_NAME)
       VALUES (SEQ_PATH_DETAILS.NEXTVAL, :pathNo, :latitude, :longitude, :pathTypeNo, :waypointOrder, :pointName)`,
      pathDetails
    );

    await connection.commit();
    res.json({
      success: true,
      pathNo: pathNo,
      message: 'GPS 기록이 성공적으로 저장되었습니다.'
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('GPS 기록 저장 실패:', error);
    res.status(500).json({
      success: false,
      message: 'GPS 기록 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  } finally {
    if (connection) await connection.close();
//    if (req.file) fs.unlinkSync(req.file.path); // 임시 파일 삭제
  }
});

// 3. 나의 산책길 목록 조회 (회원번호 기준)
router.get('/my-paths', async (req, res) => {
  let connection;
  try {
    const userNo = process.env.TEMP_USER_NO || 1;
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT p.PATH_NO, p.PATH_NAME, p.PATH_DESCRIPTION, p.TOTAL_DISTANCE,
              p.ESTIMATED_TIME, p.CREATED_DATE, pt.PATH_TAG_NAME, p.START_LATITUDE, p.START_LONGITUDE, p.PATH_IMAGE
       FROM PATHS p
       LEFT JOIN PATH_TAGS pt ON p.PATH_TAG_NO = pt.PATH_TAG_NO
       WHERE p.USER_NO = :userNo
       ORDER BY p.CREATED_DATE DESC`,
      { userNo: parseInt(userNo) }
    );
    const paths = result.rows.map(row => ({
      pathNo: row[0],
      pathName: row[1],
      pathDescription: row[2],
      totalDistance: row[3],
      estimatedTime: row[4],
      createdDate: row[5],
      pathTagName: row[6],
      startLatitude: row[7],
      startLongitude: row[8],
      pathImage: row[9]
    }));
    res.json({ success: true, paths });
  } catch (error) {
    console.error('나의 산책길 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '나의 산책길 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  } finally {
    if (connection) await connection.close();
  }
});

// 4. 특정 경로의 상세 좌표 조회
router.get('/:pathNo/details', async (req, res) => {
  let connection;
  try {
    const { pathNo } = req.params;
    connection = await oracledb.getConnection();
    const pathResult = await connection.execute(
      `SELECT p.PATH_NAME, p.PATH_DESCRIPTION, p.TOTAL_DISTANCE, p.ESTIMATED_TIME,
              pt.PATH_TAG_NAME, p.START_LATITUDE, p.START_LONGITUDE, p.PATH_IMAGE
       FROM PATHS p
       LEFT JOIN PATH_TAGS pt ON p.PATH_TAG_NO = pt.PATH_TAG_NO
       WHERE p.PATH_NO = :pathNo`,
      { pathNo: parseInt(pathNo) }
    );
    if (pathResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '경로를 찾을 수 없습니다.'
      });
    }
    const detailResult = await connection.execute(
      `SELECT pd.LATITUDE, pd.LONGITUDE, pt.PATH_TYPE_NAME,
              pd.WAYPOINT_ORDER, pd.POINT_NAME
       FROM PATH_DETAILS pd
       INNER JOIN PATH_TYPES pt ON pd.PATH_TYPE_NO = pt.PATH_TYPE_NO
       WHERE pd.PATH_NO = :pathNo
       ORDER BY pd.WAYPOINT_ORDER`,
      { pathNo: parseInt(pathNo) }
    );
    const pathInfo = {
      pathName: pathResult.rows[0][0],
      pathDescription: pathResult.rows[0][1],
      totalDistance: pathResult.rows[0][2],
      estimatedTime: pathResult.rows[0][3],
      pathTagName: pathResult.rows[0][4],
      startLatitude: pathResult.rows[0][5],
      startLongitude: pathResult.rows[0][6],
      pathImage: pathResult.rows[0][7]
    };
    const coordinates = detailResult.rows.map(row => ({
      latitude: row[0],
      longitude: row[1],
      type: row[2],
      order: row[3],
      name: row[4]
    }));
    res.json({
      success: true,
      path: pathInfo,
      coordinates: coordinates
    });
  } catch (error) {
    console.error('경로 상세 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '경로 상세 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  } finally {
    if (connection) await connection.close();
  }
});

// 5. 경로 태그 목록 조회
router.get('/tags', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      'SELECT PATH_TAG_NO, PATH_TAG_NAME FROM PATH_TAGS ORDER BY PATH_TAG_NAME'
    );
    const tags = result.rows.map(row => ({
      tagNo: row[0],
      tagName: row[1]
    }));
    res.json({ success: true, tags });
  } catch (error) {
    console.error('태그 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '태그 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  } finally {
    if (connection) await connection.close();
  }
});

module.exports = router;
