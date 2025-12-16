# Logs Dashboard / ログダッシュボード

[English](#english) | [日本語](#日本語)

---

<a name="english"></a>
## 🇬🇧 English

### Overview

A full-stack web application for managing and analyzing application logs. Built with **Next.js**, **FastAPI**, and **PostgreSQL**.

### Features

#### Core Requirements
- ✅ **Log CRUD Operations** - Create, Read, Update, Delete log entries
- ✅ **Log List Page** - Paginated list with search, filter, and sort
- ✅ **Log Detail Page** - View, edit, and delete individual logs
- ✅ **Log Creation Page** - Form to create new log entries
- ✅ **Filtering** - Filter by date range, severity, and source
- ✅ **Dashboard** - Aggregated statistics and visualizations
- ✅ **Charts** - Trend chart, severity distribution, source breakdown

#### Bonus Features
- ✅ **CSV Export** - Download filtered logs as CSV file
- ✅ **Severity Histogram** - Pie chart showing severity distribution
- ✅ **Dark Theme** - Modern dark UI design

---

### Tech Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| Frontend | Next.js 15 | React framework with App Router |
| UI Components | React + Tailwind CSS | Custom styled components |
| Charts | Recharts | Data visualization library |
| Backend | FastAPI | Modern Python web framework |
| ORM | SQLAlchemy 2.0 | Async database operations |
| Database | PostgreSQL 16 | Relational database |
| Package Manager | uv (backend) / npm (frontend) | Fast dependency management |
| Container | Docker Compose | Multi-service orchestration |

---

### Project Structure

```
logs_dashboard/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── config.py         # Configuration settings
│   │   ├── database.py       # Database connection
│   │   ├── models/
│   │   │   └── log.py        # Log SQLAlchemy model
│   │   ├── schemas/
│   │   │   └── log.py        # Pydantic schemas
│   │   └── routers/
│   │       └── logs.py       # Log API endpoints
│   ├── scripts/
│   │   └── seed_data.py      # Sample data generator
│   ├── pyproject.toml        # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   │   ├── dashboard/    # Dashboard page
│   │   │   └── logs/         # Log pages (list, detail, new)
│   │   ├── components/       # Reusable React components
│   │   └── lib/
│   │       └── api.ts        # API client
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

### Getting Started

#### Prerequisites

- Docker & Docker Compose
- OR: Python 3.13+, Node.js 20+, PostgreSQL 16+

#### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/db4862/logs_dashboard.git
cd logs_dashboard

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

#### Option 2: Local Development

**Backend:**
```bash
cd backend

# Install uv if not installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync

# Set environment variable
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/logs_dashboard"

# Start PostgreSQL (requires local instance)
# Or use: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=logs_dashboard postgres:16-alpine

# Seed sample data
uv run python scripts/seed_data.py

# Start backend server
uv run uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Set environment variable
export NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

---

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/logs` | List logs with pagination/filtering |
| `POST` | `/api/v1/logs` | Create new log |
| `GET` | `/api/v1/logs/{id}` | Get log by ID |
| `PUT` | `/api/v1/logs/{id}` | Update log |
| `DELETE` | `/api/v1/logs/{id}` | Delete log |
| `GET` | `/api/v1/logs/sources` | List unique sources |
| `GET` | `/api/v1/logs/stats` | Get aggregated statistics |
| `GET` | `/api/v1/logs/trend` | Get log trend over time |
| `GET` | `/api/v1/logs/export` | Export logs as CSV |

---

### Database Schema

```sql
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,  -- DEBUG, INFO, WARNING, ERROR, CRITICAL
    source VARCHAR(255) NOT NULL,
    metadata_json TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for filtering performance
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_severity ON logs(severity);
CREATE INDEX idx_logs_source ON logs(source);
```

---

### Design Decisions

#### Why Next.js App Router?
- Modern React patterns with Server Components
- File-based routing simplifies navigation structure
- Built-in optimizations for production

#### Why FastAPI?
- Native async support for PostgreSQL
- Automatic OpenAPI documentation
- Pydantic validation for type safety

#### Why Recharts?
- Declarative chart components fit React paradigm
- Good TypeScript support
- Customizable with standard CSS

#### Frontend Architecture (React/Three.js Bridge)
For those with 3D graphics background, here's how React concepts map:

| Three.js Concept | React Concept | Explanation |
|------------------|---------------|-------------|
| Scene Graph | Component Tree | Hierarchical structure, parent state flows down |
| Render Loop | Re-render Cycle | State changes (useState) trigger updates |
| Attributes/Uniforms | Props | Data passed down to configure components |
| Shaders | CSS/Styled Components | Logic determining visual appearance |
| Loaders | API Client | Fetch external resources for scene |

---

### GenAI Usage Disclosure

This project was developed with assistance from generative AI (Claude).

**Example prompts used:**
1. "Create a FastAPI backend with async SQLAlchemy for PostgreSQL"
2. "Build a Next.js dashboard with Recharts for log analytics"
3. "Implement pagination with filtering in both frontend and backend"

---

<a name="日本語"></a>
## 🇯🇵 日本語

### 概要

アプリケーションログを管理・分析するためのフルスタックWebアプリケーション。**Next.js**、**FastAPI**、**PostgreSQL**で構築。

### 機能

#### 必須要件
- ✅ **ログCRUD操作** - ログエントリの作成、読み取り、更新、削除
- ✅ **ログ一覧ページ** - 検索、フィルター、ソート付きのページネーション
- ✅ **ログ詳細ページ** - 個別ログの表示、編集、削除
- ✅ **ログ作成ページ** - 新規ログエントリの作成フォーム
- ✅ **フィルタリング** - 日付範囲、重大度、ソースでフィルター
- ✅ **ダッシュボード** - 集計統計と可視化
- ✅ **チャート** - トレンドチャート、重大度分布、ソース内訳

#### ボーナス機能
- ✅ **CSVエクスポート** - フィルターされたログをCSVでダウンロード
- ✅ **重大度ヒストグラム** - 重大度分布を示す円グラフ
- ✅ **ダークテーマ** - モダンなダークUIデザイン

---

### 技術スタック

| レイヤー | 技術 | 説明 |
|---------|------|------|
| フロントエンド | Next.js 15 | App RouterによるReactフレームワーク |
| UIコンポーネント | React + Tailwind CSS | カスタムスタイルコンポーネント |
| チャート | Recharts | データ可視化ライブラリ |
| バックエンド | FastAPI | モダンなPython Webフレームワーク |
| ORM | SQLAlchemy 2.0 | 非同期データベース操作 |
| データベース | PostgreSQL 16 | リレーショナルデータベース |
| パッケージ管理 | uv (backend) / npm (frontend) | 高速な依存関係管理 |
| コンテナ | Docker Compose | マルチサービスオーケストレーション |

---

### セットアップ

#### 必要条件

- Docker & Docker Compose
- または: Python 3.13+、Node.js 20+、PostgreSQL 16+

#### 方法1: Docker Compose（推奨）

```bash
# リポジトリのクローン
git clone https://github.com/db4862/logs_dashboard.git
cd logs_dashboard

# 全サービスを起動
docker-compose up --build

# アプリケーションにアクセス
# フロントエンド: http://localhost:3000
# バックエンドAPI: http://localhost:8000
# APIドキュメント: http://localhost:8000/docs
```

#### 方法2: ローカル開発

**バックエンド:**
```bash
cd backend

# uvがインストールされていない場合
curl -LsSf https://astral.sh/uv/install.sh | sh

# 依存関係のインストール
uv sync

# 環境変数の設定
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/logs_dashboard"

# PostgreSQLを起動（ローカルインスタンスが必要）
# または: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=logs_dashboard postgres:16-alpine

# サンプルデータの投入
uv run python scripts/seed_data.py

# バックエンドサーバーを起動
uv run uvicorn app.main:app --reload --port 8000
```

**フロントエンド:**
```bash
cd frontend

# 依存関係のインストール
npm install

# 環境変数の設定
export NEXT_PUBLIC_API_URL=http://localhost:8000

# 開発サーバーを起動
npm run dev
```

---

### APIエンドポイント

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| `GET` | `/api/v1/logs` | ページネーション/フィルター付きログ一覧 |
| `POST` | `/api/v1/logs` | 新規ログ作成 |
| `GET` | `/api/v1/logs/{id}` | IDでログ取得 |
| `PUT` | `/api/v1/logs/{id}` | ログ更新 |
| `DELETE` | `/api/v1/logs/{id}` | ログ削除 |
| `GET` | `/api/v1/logs/sources` | ユニークソース一覧 |
| `GET` | `/api/v1/logs/stats` | 集計統計を取得 |
| `GET` | `/api/v1/logs/trend` | 時系列トレンドを取得 |
| `GET` | `/api/v1/logs/export` | ログをCSVでエクスポート |

---

### 設計上の決定

#### なぜNext.js App Router？
- Server ComponentsによるモダンなReactパターン
- ファイルベースルーティングでナビゲーション構造を簡素化
- 本番環境向けの最適化が組み込み

#### なぜFastAPI？
- PostgreSQL用のネイティブ非同期サポート
- 自動OpenAPIドキュメント生成
- Pydanticバリデーションによる型安全性

#### フロントエンドアーキテクチャ（React/Three.js ブリッジ）
3Dグラフィックス経験者向けに、ReactコンセプトのマッピングFeng：

| Three.jsコンセプト | Reactコンセプト | 説明 |
|-------------------|----------------|------|
| シーングラフ | コンポーネントツリー | 階層構造、親の状態が子に流れる |
| レンダーループ | 再レンダリングサイクル | 状態変更(useState)が更新をトリガー |
| Attributes/Uniforms | Props | コンポーネントを設定するためのデータ |
| シェーダー | CSS/Styled Components | 視覚的外観を決定するロジック |
| ローダー | APIクライアント | シーン用の外部リソースを取得 |

---

### 生成AIの使用について

本プロジェクトの開発には生成AI（Claude）を使用しました。

**使用したプロンプトの例:**
1. 「PostgreSQL用の非同期SQLAlchemyでFastAPIバックエンドを作成」
2. 「ログ分析用のRechartsでNext.jsダッシュボードを構築」
3. 「フロントエンドとバックエンドの両方でフィルタリング付きページネーションを実装」

---

## License / ライセンス

MIT License

