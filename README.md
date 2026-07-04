# 💬 Clo_eTalk

> **"외우지 말고, 골라 쓰고, 몸으로 익혀라!"**

원어민 표현 체화 기반 영어 인터뷰 트레이닝 서비스입니다. AI가 사용자의 답변을 교정하고, 상황에 맞는 원어민 표현 3가지(쉬운 표현 / 평범한 표현 / 독창적인 표현)를 제안하면, 사용자는 그 표현을 직접 조립하고 반복 연습(따라쓰기 → 단어 행맨 → 문장 행맨)하며 몸에 익히는 방식으로 학습합니다.

---

## 📑 목차

- [기획 의도](#-기획-의도)
- [핵심 학습 메커니즘](#-핵심-학습-메커니즘)
- [시스템 아키텍처 (View 0~6)](#️-시스템-아키텍처-view-0-6)
- [기술 스택](#-기술-스택)
- [파일 구조](#-파일-구조)
- [설치 방법](#-설치-방법)
- [환경 변수 설정 (.env)](#-환경-변수-설정-env)
- [실행 방법](#-실행-방법)
- [API 명세](#-api-명세)
- [Node.js 버전 관련 안내](#-nodejs-버전-관련-안내)
- [트러블슈팅](#-트러블슈팅)
- [향후 개선 예정 사항](#-향후-개선-예정-사항)

---

## 🎯 기획 의도

기존 영어 학습 서비스 대부분은 "정답 문장 하나"를 암기시키는 방식에 그칩니다. Clo_eTalk는 이 지점을 다르게 접근합니다.

1. **암기가 아닌 선택** — 사용자가 이미 뱉은 날것의 답변을 기반으로, AI가 딱 3개(쉬움/평범/독창)의 원어민 표현만 제안합니다. 선택지가 많으면 오히려 학습에 방해가 되기 때문에 의도적으로 최소화했습니다.
2. **내 문장으로 만드는 체화** — 남이 만든 예문이 아니라, 내가 실제로 대답한 문장을 원어민 표현으로 업그레이드하기 때문에 몰입도와 기억 정착률이 높습니다.
3. **단계적 반복 학습** — 보고 따라쓰기 → 안 보고 단어 채우기 → 안 보고 문장 전체 완성까지, 난이도를 점진적으로 높이며 장기 기억으로 전환시킵니다.
4. **유기적으로 이어지는 인터뷰 흐름** — 사용자가 마스터한 문장과 사전에 입력한 관심사를 조합해 AI가 실시간으로 후속 질문을 생성하므로, 기계적인 문제 은행이 아니라 실제 인터뷰처럼 대화가 이어집니다.

메인 코치 아바타 **Qlue(큐)** 는 박스 머리 모양의 AI 캐릭터로, 사용자가 헤매는 지점마다 다음 한 글자만 짚어주는 최소 개입형 힌트를 제공하는 페이스메이커 역할을 합니다.

---

## 🧩 핵심 학습 메커니즘

| 메커니즘 | 설명 |
|---|---|
| **3대 카테고리 단일 제안** | 핵심 구문당 쉬운 표현 1개 / 평범한 표현 1개 / 독창적인 표현 1개, 총 3개만 제시 |
| **인라인 임베디드 입력창** | 문장 흐름 한가운데 빈칸 자리 그대로 입력창이 위치해 학습 집중도 극대화 |
| **스마트 락인 & 자동 채우기** | 맞은 부분까지는 실시간 고정(Lock-in)되고, 틀린 지점 바로 다음 글자만 힌트로 제공 |
| **세션 확장성** | 마스터한 문장 + 관심사를 조합해 AI가 실시간 후속 질문(총 2회)을 생성, 유기적인 인터뷰 흐름 구현 |

---

## 🗺️ 시스템 아키텍처 (View 0~6)

새로고침 없이 레이어가 전환되는 **싱글 페이지 애플리케이션(SPA)** 구조입니다.

| View | 이름 | 설명 |
|---|---|---|
| 0 | 인터뷰 설정 | 관심사 키워드, 문장별 반복 학습 횟수(2/3/5회) 설정 |
| 1 | 답변 입력창 | AI의 질문에 대한 사용자의 첫 날것의 영어 답변 수집 |
| 2 | 문장 빌더 | 개선이 필요한 구문을 카테고리별 원어민 표현으로 교체해 최종 문장 조립 |
| 3 | 보고 따라쓰기 | 상단 가이드 문장을 보며 인라인 입력창에 동일하게 타이핑 |
| 4 | 단어 행맨 | 조립한 핵심 표현이 빈칸 처리, 안 보고 맞히는 단계 |
| 5 | 전체 문장 행맨 | 문장 전체가 가려진 상태에서 통째로 완성하는 최종 관문 |
| 6 | 결과 요약 | 라운드 종료 리포트 표시, 버튼 클릭 시 후속 질문(Q2, Q3) 생성 후 View 1로 순환 (3라운드 종료 시 세션 종료) |

---

## 🛠 기술 스택

- **Runtime**: Node.js (16.14.2 기준 동작 확인, 자세한 내용은 [Node.js 버전 관련 안내](#-nodejs-버전-관련-안내) 참고)
- **Backend**: Express.js
- **AI Providers** (폴백 구조로 순차 호출): OpenAI (`gpt-4o-mini`) → Anthropic Claude → Google Gemini (`gemini-2.5-flash`)
- **Frontend**: Vanilla JavaScript, HTML, CSS (프레임워크 없는 순수 SPA 구현)
- **환경 변수 관리**: dotenv
- **HTTP Polyfill**: node-fetch v2, formdata-node (Node 16 환경 대응)

---

## 📁 파일 구조

```
clo-etalk/
├── server.js              # Express 백엔드 (AI 폴백 라우팅, /api/correct, /api/next-question)
├── package.json           # 의존성 및 스크립트 정의
├── package-lock.json      # 의존성 버전 잠금 (npm install 시 자동 생성)
├── .env                   # API 키 보관 (Git 제외 필수)
├── .env.example           # .env 작성 가이드용 템플릿 (실제 키 값 없음)
├── .gitignore             # node_modules, .env 등 제외 설정
├── .nvmrc                 # (선택) 프로젝트 권장 Node 버전 명시
└── public/                # 정적 프론트엔드 리소스
    ├── index.html          # SPA 마크업 (View 0~6)
    ├── style.css           # 전체 스타일시트
    └── app.js              # 클라이언트 로직 (View 전환, 타이핑 검증, API 호출)
```

---

## 📦 설치 방법

### 1. 사전 요구사항
- Node.js **16.14.0 이상** (권장: 18 LTS 이상 — 자세한 내용은 하단 참고)
- npm (Node.js 설치 시 함께 설치됨)
- OpenAI / Anthropic / Google Gemini API 키 중 최소 1개 이상

### 2. 저장소 클론 및 의존성 설치

```bash
git clone <저장소 URL>
cd clo-etalk
npm install
```

`package.json`에 정의된 아래 의존성들이 설치됩니다.

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0",
    "@google/generative-ai": "^0.21.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "formdata-node": "^4.4.1",
    "node-fetch": "^2.7.0",
    "openai": "^4.68.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.7"
  }
}
```

> ⚠️ **주의**: `node-fetch`는 반드시 **v2**를 사용해야 합니다. v3는 ESM 전용이라 `require()` 방식과 호환되지 않습니다.

---

## 🔑 환경 변수 설정 (.env)

프로젝트 루트에 `.env` 파일을 생성하고 아래 내용을 채워주세요. **최소 1개의 API 키만 있어도 서버는 동작**하지만, 폴백 구조를 온전히 활용하려면 3개 모두 등록하는 것을 권장합니다.

```env
# OpenAI (1순위 호출)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# Anthropic Claude (2순위 호출, OpenAI 실패 시 자동 폴백)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx

# Google Gemini (3순위 호출, 위 둘 다 실패 시 자동 폴백 / 후속 질문 생성 전용으로도 사용)
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxx
```

### API 키 발급처
| Provider | 발급 링크 |
|---|---|
| OpenAI | https://platform.openai.com/api-keys |
| Anthropic | https://console.anthropic.com/settings/keys |
| Google Gemini | https://aistudio.google.com/apikey |

> 🔒 `.env` 파일은 절대 Git에 커밋하지 마세요. `.gitignore`에 이미 등록되어 있습니다. 만약 실수로 커밋된 이력이 있다면 `git rm --cached .env` 실행 후 해당 키들을 즉시 재발급하세요.

---

## 🚀 실행 방법

### 개발 모드 (파일 변경 시 자동 재시작)
```bash
npm run dev
```

### 일반 실행
```bash
npm start
```

서버가 정상적으로 뜨면 아래 로그가 출력됩니다.
```
🚀 Qlue's Local Server is running on http://localhost:3000
```

브라우저에서 `http://localhost:3000`으로 접속하면 서비스를 사용할 수 있습니다.

---
