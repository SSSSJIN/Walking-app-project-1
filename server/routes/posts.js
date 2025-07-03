const express = require('express');
const oracledb = require('oracledb');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const router = express.Router();

// 업로드 폴더 생성
const uploadDir = path.join(__dirname, '../uploads');
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

// 게시글 작성
router.post('/create-from-path', upload.array('images', 5), async (req, res) => {
  let connection;
  try {
    const { title, content, pathNo } = req.body;
    const userNo = process.env.TEMP_USER_NO; // 임시 사용자 번호

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '제목과 내용은 필수입니다.'
      });
    }

    // 업로드된 파일 경로들
    const imagePaths = req.files ? req.files.map(file => `/uploads/${file.filename}`).join(',') : null;

    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `INSERT INTO POSTS 
       (POST_NO, TITLE, USER_NO, CONTENT, IMAGE_PATHS, PATH_NO)
       VALUES (SEQ_POSTS.NEXTVAL, :title, :userNo, :content, :imagePaths, :pathNo)
       RETURNING POST_NO INTO :postNo`,
      {
        title,
        userNo: parseInt(userNo),
        content,
        imagePaths,
        pathNo: pathNo ? parseInt(pathNo) : null,
        postNo: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      }
    );

    await connection.commit();

    res.json({
      success: true,
      postNo: result.outBinds.postNo[0],
      message: '게시글이 성공적으로 작성되었습니다.'
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('게시글 작성 실패:', error.message);
    res.status(500).json({
      success: false,
      message: '게시글 작성 중 오류가 발생했습니다.'
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// 게시글 목록 조회 (순환 참조 오류 방지)
router.get('/', async (req, res) => {
    let connection;
    try {
        const { limit = 20, offset = 0 } = req.query;
        connection = await oracledb.getConnection();

        const result = await connection.execute(
            `SELECT p.POST_NO, p.TITLE, m.USER_NAME, TO_CHAR(p.CONTENT) AS CONTENT, p.IMAGE_PATHS,
                    TO_CHAR(p.CREATED_DATE, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_DATE,
                    p.VIEW_COUNT, path.PATH_NAME, path.PATH_IMAGE, path.TOTAL_DISTANCE, path.ESTIMATED_TIME
             FROM POSTS p
             INNER JOIN MEMBERS m ON p.USER_NO = m.USER_NO
             LEFT JOIN PATHS path ON p.PATH_NO = path.PATH_NO
             ORDER BY p.CREATED_DATE DESC
             OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
            {
                offset: parseInt(offset),
                limit: parseInt(limit)
            }
        );

        const posts = result.rows.map(row => ({
            postNo: Number(row[0]),
            title: String(row[1]),
            userName: String(row[2]),
            content: String(row[3]),
            imagePaths: row[4] ? String(row[4]).split(',') : [],
            createdDate: String(row[5]),
            viewCount: Number(row[6]),
            pathName: row[7] ? String(row[7]) : null,
            pathImage: row[8] ? String(row[8]) : null,
            totalDistance: row[9],
            estimatedTime: row[10],
        }));

        res.json({
            success: true,
            posts: posts // 순수 데이터만 반환
        });

    } catch (error) {
        console.error('게시글 목록 조회 실패:', error.message);
        res.status(500).json({
            success: false,
            message: '게시글 목록 조회 중 오류가 발생했습니다.'
        });
    } finally {
        if (connection) await connection.close();
    }
});

// 게시글 상세 조회 (수정)
router.get('/:postNo', async (req, res) => {
  let connection;
  try {
    const { postNo } = req.params;
    connection = await oracledb.getConnection();

    // 조회수 증가
    await connection.execute(
      'UPDATE POSTS SET VIEW_COUNT = VIEW_COUNT + 1 WHERE POST_NO = :postNo',
      { postNo: parseInt(postNo) }
    );

    const result = await connection.execute(
      `SELECT p.POST_NO, p.TITLE, m.USER_NAME, TO_CHAR(p.CONTENT) AS CONTENT, p.IMAGE_PATHS,
              TO_CHAR(p.CREATED_DATE, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_DATE,
              p.VIEW_COUNT, path.PATH_NAME, path.PATH_NO, path.PATH_IMAGE, path.TOTAL_DISTANCE, path.ESTIMATED_TIME
       FROM POSTS p
       INNER JOIN MEMBERS m ON p.USER_NO = m.USER_NO
       LEFT JOIN PATHS path ON p.PATH_NO = path.PATH_NO
       WHERE p.POST_NO = :postNo`,
      { postNo: parseInt(postNo) }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '게시글을 찾을 수 없습니다.'
      });
    }

    const row = result.rows[0];
    const post = {
      postNo: Number(row[0]),
      title: String(row[1]),
      userName: String(row[2]),
      content: String(row[3]),
      imagePaths: row[4] ? String(row[4]).split(',') : [],
      createdDate: String(row[5]),
      viewCount: Number(row[6]),
      pathName: row[7] ? String(row[7]) : null,
      pathNo: row[8] ? Number(row[8]) : null,
      pathImage: row[9] ? String(row[9]) : null,
      totalDistance: row[10] ? Number(row[10]) : null,
      estimatedTime: row[11] ? Number(row[11]) : null
    };

    // ⭐️ coordinates 추가 (pathNo가 있을 때만)
    let coordinates = [];
    if (post.pathNo) {
      const coordsResult = await connection.execute(
        `SELECT LATITUDE, LONGITUDE, PATH_TYPE_NO, WAYPOINT_ORDER, POINT_NAME
        FROM PATH_DETAILS WHERE PATH_NO = :pathNo ORDER BY WAYPOINT_ORDER`,
        { pathNo: post.pathNo }
      );

      // PATH_TYPE_NO → type 문자열 매핑
      const typeMap = {
        1: 'START',      // 출발지
        2: 'WAYPOINT',   // 경유지
        3: 'END'         // 도착지
      };

      coordinates = coordsResult.rows.map(coordRow => ({
        lat: Number(coordRow[0]),
        lng: Number(coordRow[1]),
        type: typeMap[coordRow[2]] || 'WAYPOINT',
        order: coordRow[3],
        name: coordRow[4]
      }));
    }

    await connection.commit();

    res.json({
      success: true,
      post: {
        ...post,
        coordinates // ⭐️ 프론트엔드에서 사용할 수 있도록 포함
      }
    });

  } catch (error) {
    console.error('게시글 상세 조회 실패:', error.message);
    res.status(500).json({
      success: false,
      message: '게시글 상세 조회 중 오류가 발생했습니다.'
    });
  } finally {
    if (connection) await connection.close();
  }
});


module.exports = router;
