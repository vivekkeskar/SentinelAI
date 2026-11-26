# 🛡️ SentinelAI

### AI-Powered Production Incident Investigation System

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql)
![LangGraph](https://img.shields.io/badge/LangGraph-MultiAgent-blue?style=for-the-badge)
![Groq](https://img.shields.io/badge/Groq-LLM-orange?style=for-the-badge)
![ChromaDB](https://img.shields.io/badge/ChromaDB-VectorDB-purple?style=for-the-badge)
![Tests](https://img.shields.io/badge/Local_Checks-22%2F22_Passed-brightgreen?style=for-the-badge)

---

## 📌 Overview

SentinelAI is an AI-powered full-stack application designed to assist developers and IT operations teams in investigating production incidents.

It analyzes application logs, retrieves relevant technical documentation, identifies potential root causes, and generates actionable resolution recommendations using a multi-agent AI workflow.

The platform combines Large Language Models, Retrieval-Augmented Generation (RAG), semantic search, and authenticated REST APIs.

---

## 🎯 Problem Statement

Traditional production incident investigation requires developers to manually analyze application logs, search technical documentation, identify root causes, and prepare investigation reports.

SentinelAI automates key parts of this process using intelligent AI agents and knowledge-based retrieval.

---

## 🚀 Key Features

- AI-powered application log analysis
- LangGraph multi-agent investigation workflow
- Retrieval-Augmented Generation (RAG)
- HuggingFace semantic embeddings
- ChromaDB vector database
- Potential root cause identification
- AI-generated resolution recommendations
- Smart knowledge base relevance filtering
- JWT-based authentication
- User-specific incident history
- MySQL database persistence
- Knowledge base reference tracking
- Downloadable PDF investigation reports
- Responsive React dashboard
- REST API integration
- Automated functional and basic security testing

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    A[User] --> B[React Frontend]
    B --> C[FastAPI Backend]
    C --> D[JWT Authentication]
    D --> E[LangGraph Workflow]
    E --> F[Log Analyzer Agent]
    F --> G[RAG Retriever Agent]
    G <--> H[(ChromaDB)]
    I[Technical Documents] --> J[HuggingFace Embeddings]
    J --> H
    G --> K[Root Cause Analyzer]
    K --> L[Solution Agent]
    F -.-> M[Groq LLM]
    K -.-> M
    L -.-> M
    L --> N[Investigation Report]
    N --> O[(MySQL)]
    N --> B
    B --> P[PDF Export]
```

---

## 🤖 Multi-Agent AI Workflow

| Agent | Responsibility |
|---|---|
| Log Analyzer Agent | Analyzes logs and identifies error patterns |
| RAG Retriever Agent | Retrieves relevant technical documentation |
| Root Cause Analyzer | Identifies potential incident causes |
| Solution Agent | Generates troubleshooting recommendations |

LangGraph manages the workflow and information flow between agents.

---

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| Frontend | React.js, Vite |
| Backend | Python, FastAPI |
| AI Orchestration | LangGraph |
| LLM Integration | LangChain, Groq |
| Language Model | openai/gpt-oss-120b |
| Embeddings | HuggingFace Sentence Transformers |
| Vector Database | ChromaDB |
| Relational Database | MySQL |
| Authentication | JWT |
| PDF Generation | jsPDF |
| API Documentation | Swagger UI |
| Development Environment | VS Code |

---

## 🧠 RAG Pipeline

1. Load technical troubleshooting documents.
2. Split documents into smaller chunks.
3. Generate semantic embeddings.
4. Store embeddings in ChromaDB.
5. Retrieve relevant technical knowledge.
6. Filter unrelated documents.
7. Provide retrieved context to AI agents.
8. Save knowledge base references with reports.

### Embedding Model

`sentence-transformers/all-MiniLM-L6-v2`

### Knowledge Base

- Database connection failures
- Database connection pool exhaustion
- Payment gateway timeouts
- API gateway HTTP 504 errors

---

## 📂 Project Structure

```text
SentinelAI/
├── backend/
│   ├── agents/
│   │   └── investigation_graph.py
│   ├── api/
│   ├── database/
│   │   ├── db.py
│   │   └── incident_repository.py
│   ├── rag/
│   │   ├── ingest.py
│   │   └── retriever.py
│   ├── services/
│   │   └── groq_service.py
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── utils/
│   │   │   └── downloadReport.js
│   │   └── App.jsx
│   └── package.json
├── data/
│   ├── documents/
│   ├── logs/
│   └── incidents/
├── tests/
└── README.md
```

---

## ⚙️ Installation and Setup

### Prerequisites

- Python
- Node.js and npm
- MySQL Server
- Groq API Key
- Git

### Step 1: Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 2: Install Dependencies

Install the backend dependencies using the project's dependency configuration.

If requirements.txt is available:

```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables

Configure the following settings using the variable names defined in the backend:

- Groq API Key
- MySQL Host
- MySQL Username
- MySQL Password
- MySQL Database Name
- JWT Secret Key

Never expose actual credentials in the repository.

### Step 4: Configure Database

```sql
CREATE DATABASE IF NOT EXISTS sentinelai_db;
```

Initialize the required users and incidents tables using the application database schema.

### Step 5: Initialize Knowledge Base

```bash
python -m backend.rag.ingest
```

### Step 6: Start Backend

```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Backend URL: http://127.0.0.1:8000

Swagger API: http://127.0.0.1:8000/docs

### Step 7: Start Frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: http://localhost:5173

---

## 🔗 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | / | Backend status |
| GET | /health | Health check |
| POST | /auth/login | User authentication |
| POST | /analyze | Analyze incident logs |
| GET | /incidents | Retrieve user incident history |
| GET | /incidents/{incident_id} | Retrieve authorized investigation |
| GET | /docs | Interactive API documentation |

Protected endpoints require a valid JWT access token.

---

## 📝 Example Incident Investigation

### Input Logs

```text
ERROR Database connection timeout
WARNING Database connection pool exhausted
ERROR API /orders returned HTTP 500
```

### Log Analysis

The application is experiencing database connectivity and connection pool exhaustion issues.

### Potential Root Cause

Database connection pool exhaustion may be caused by high traffic, slow queries, connection leaks, or insufficient pool capacity.

### Recommended Solutions

- Monitor active database connections.
- Investigate slow database queries.
- Check for connection leaks.
- Review connection pool configuration.
- Monitor application traffic and database performance.

### Knowledge Base Reference

`database_troubleshooting.txt`

AI-generated findings should be validated against actual production metrics before applying remediation.

---

## 🔐 Security Features

- JWT-based authentication
- Protected API endpoints
- Invalid JWT rejection
- Tampered JWT rejection
- Incident ownership validation
- User-specific incident access control
- Invalid input rejection
- Tested cross-user access restrictions

---

## 🧪 Automated Testing

### Functional Testing

| Test | Result |
|---|---|
| Backend Health | PASS |
| Python Syntax | PASS |
| MySQL Read Test | PASS |
| Database RAG Retrieval | PASS |
| Payment Gateway RAG Retrieval | PASS |
| API Gateway RAG Retrieval | PASS |
| Unrelated Log Filtering | PASS |
| Frontend Production Build | PASS |

### Security Testing

| Security Check | Result |
|---|---|
| Unauthorized API Access | PASS |
| Invalid JWT Rejection | PASS |
| Invalid Credentials | PASS |
| SQL Injection Login Attempt | PASS |
| Valid Login and JWT Generation | PASS |
| Authenticated History Access | PASS |
| Own Incident Access | PASS |
| Tampered JWT Rejection | PASS |
| Invalid Incident ID | PASS |
| Cross-User Incident Access | PASS |

### Final Test Results

| Category | Passed | Failed |
|---|---:|---:|
| Functional Checks | 8 | 0 |
| Basic Security Checks | 14 | 0 |
| Total | 22 | 0 |

**All 22 executed automated checks passed successfully.**

These results represent executed local test cases, not a comprehensive production security audit.

---

## 📸 Application Screens

- Login and Registration
- Dashboard
- AI Log Analyzer
- Investigation Report
- Incident History
- Knowledge Base References
- PDF Report Export

Application screenshots will be added to the repository.

---

## 💡 Use Cases

- Production incident investigation
- Application log analysis
- Database failure troubleshooting
- Payment gateway failure investigation
- API timeout troubleshooting
- Developer productivity assistance
- DevOps and IT operations support

---

## 🔮 Future Enhancements

- Real-time log monitoring
- Automated incident detection
- Incident severity classification
- Slack and email notifications
- Docker containerization
- Cloud deployment
- Expanded technical knowledge base
- Role-based access control
- Incident analytics dashboard
- Monitoring platform integration
- Production security hardening
- AI response quality evaluation

---

## 🎓 Learning Outcomes

- Generative AI application development
- Retrieval-Augmented Generation
- Multi-agent AI orchestration
- Semantic search and vector databases
- REST API development
- Full-stack web development
- Database integration
- Authentication and authorization
- Automated functional and security testing
- AI-powered technical troubleshooting

---

## 📊 Project Status

- [x] Backend Development
- [x] Frontend Development
- [x] Groq LLM Integration
- [x] LangGraph Multi-Agent Workflow
- [x] RAG Implementation
- [x] ChromaDB Integration
- [x] MySQL Integration
- [x] JWT Authentication
- [x] Incident History
- [x] PDF Report Generation
- [x] Automated Functional Testing
- [x] Basic Security Testing
- [ ] Production Security Hardening
- [ ] Cloud Deployment

---

## 🙏 Acknowledgements

- Python
- FastAPI
- React
- LangChain
- LangGraph
- Groq
- HuggingFace
- ChromaDB
- MySQL

---

<div align="center">

### 🛡️ SentinelAI

**Intelligent Investigation. Faster Insights.**

⭐ Star this repository if you find this project useful!

</div>