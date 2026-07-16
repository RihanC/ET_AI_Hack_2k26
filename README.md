# 🛡️ ISIP — Industrial Safety Intelligence Platform (ET_AI)

[![React](https://img.shields.io/badge/React-19.0-blue.svg?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r185-black.svg?logo=three.js&logoColor=white)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-grade, AI-powered industrial plant monitoring, safety intelligence, and analytics platform. Designed for heavy industries, **ISIP** combines real-time IoT sensor telemetry, worker safety tracking, permit administration, compliance metrics, and an interactive 3D layout of the plant to minimize operational hazards and maximize safety protocols.

---

## ✨ Key Features

*   🗺️ **Interactive 3D Plant Map**
    *   Powered by `@react-three/fiber` and `@react-three/drei`.
    *   3D layout visualizer of zones, machinery, equipment sensors, and active personnel locations.
*   🧠 **AI Risk Center**
    *   Machine learning-driven hazard scoring, real-time safety risk assessment, and anomaly detection.
    *   Dynamic recommendation panel suggesting preventative actions for plant managers.
*   🌡️ **Live Sensor Telemetry**
    *   Real-time monitoring of gas levels, ambient temperature, high pressure, and humidity levels.
    *   Data updates dynamically using customized telemetry simulation hooks (`useLiveData.ts`).
*   👮 **Worker Safety Monitor**
    *   Live check-ins, zone assignments, and vitals tracking.
    *   Visual alerts for unauthorized entry or fall-detection warnings.
*   💬 **Integrated AI Copilot**
    *   Interactive conversational panel available globally.
    *   Ask questions about plant compliance status, generate summaries, or issue instant safety check commands.
*   📊 **Reports & Analytics Dashboard**
    *   High-fidelity time-series and aggregate analysis charts utilizing `recharts`.
    *   Data tables displaying incident trends, shift performance logs, and equipment degradation cycles.
*   📜 **Digital Permits & Compliance**
    *   Permit-to-work requests status monitor (Approved, Pending, Expired).
    *   Standard compliance levels checklist tracking ISO/OSHA metrics.

---

## 🛠️ Tech Stack & Libraries

*   **Core Framework**: [React 19](https://react.dev/) & [Vite 8](https://vite.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **3D Graphics & Canvas**: [Three.js](https://threejs.org/), [@react-three/fiber](https://r3f.docs.pmnd.rs/getting-started/introduction), [@react-three/drei](https://github.com/pmndrs/drei)
*   **Data Visualization**: [Recharts](https://recharts.org/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Linter**: [Oxlint](https://oxc-project.github.io/docs/guide/usage/linter.html) (Extremely fast JavaScript/TypeScript linter)

---

## 📁 Repository Structure

```text
ET_AI/
├── src/
│   ├── assets/              # Static logo, branding assets & images
│   ├── components/
│   │   └── layout/          # AICopilot, Header, and Sidebar components
│   ├── data/
│   │   └── mockData.ts      # Structured telemetry logs, worker lists, & safety configurations
│   ├── hooks/
│   │   └── useLiveData.ts   # Real-time state simulation loop hook
│   ├── pages/               # Primary application page modules
│   │   ├── AIRiskCenter.tsx
│   │   ├── ActivePermits.tsx
│   │   ├── ComplianceCenter.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── PlantMap.tsx
│   │   ├── ReportsAnalytics.tsx
│   │   ├── SensorMonitor.tsx
│   │   ├── Timeline.tsx
│   │   └── WorkerMonitor.tsx
│   ├── App.css              # Global layout styles
│   ├── App.tsx              # Page routing & core framework mounting
│   ├── index.css            # Base styles & animation definitions
│   └── main.tsx             # DOM initialization entrypoint
├── index.html               # Main page template (contains Google Fonts & Metadata)
├── vite.config.ts           # Development & build config
└── tsconfig.json            # Strict TypeScript configuration
