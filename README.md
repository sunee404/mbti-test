# MBTI 왕국 (Express + SQLite3)

모바일(375~430px) 중심의 귀여운 MBTI 테스트 웹입니다. (캐릭터: 포근토끼)

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

## 기능

- **MBTI테스트**: 이름 입력 → DB에 저장된 질문을 순서대로 진행 → 결과 화면 표시 + SQLite에 저장
- **성격 유형**: 16유형 도감(유형별 색/무드/캐릭터)
- **질문 수정**: 질문/선택지/정렬/활성 여부를 웹에서 수정 (SQLite `questions` 테이블)
- **결과 보기**: 저장된 결과 목록/상세 보기 (SQLite `results` 테이블)

## 데이터베이스

최초 실행 시 자동 생성:

- `data/mbti.sqlite3`
- `questions`: 질문(차원 EI/SN/TF/JP, 정렬번호, 선택지 A/B, 활성 여부)
- `results`: 결과(이름, 측정일, MBTI, 상세 JSON)

## 참고

- 선택지 **A는 차원의 첫 글자(E/S/T/J)**, 선택지 **B는 두번째 글자(I/N/F/P)** 점수로 카운트됩니다.

