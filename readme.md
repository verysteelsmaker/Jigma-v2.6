![screenshot](./screenshot.png)

Jigma 2.6

Jigma is a powerful desktop application built with Electron and React, designed for visual data modeling and AI-driven node-based workflows. It allows users to create complex entity relationship graphs and leverage Generative AI to process or analyze data.
🚀 Features

    Visual Flow Editor: A node-based interface for building structured relationships between entities (People, Emails, Websites, etc.).

    AI-Powered (GenAI): Integrated Google Generative AI capabilities to automate data processing and insights.

    Cross-Platform: Built on Electron for a native desktop experience (Windows, macOS, Linux).

    Multi-language Support: Built-in translation system for global accessibility.

    History Management: Full undo/redo support via a dedicated History Context.

    Modern Tech Stack: Powered by Vite, React, and TypeScript for high performance and type safety.

🛠 Tech Stack

    Frontend: React.js, TypeScript

    Bundler: Vite

    Desktop Framework: Electron

    AI: Google Generative AI (Gemini API)

    State Management: React Context API (History, Settings, Auth)

📁 Project Structure
code Text

├── electron/          # Main process and Electron-specific logic
├── src/
│   ├── components/    # UI components (Nodes, Edges, Modals, Sidebar)
│   ├── contexts/      # React Contexts (API Keys, History, Language)
│   ├── utils/         # Helper functions (AI logic, translations)
│   ├── types.ts       # Global TypeScript definitions
│   └── App.tsx        # Main application entry point

⚙️ Installation & Setup

    Clone the repository:
    code Bash

    git clone https://github.com/your-username/jigma.git
    cd jigma

    Install dependencies:
    code Bash

    npm install

    Environment Variables:
    Create a .env.local file in the root directory and add your API keys:
    code Env

    VITE_GEMINI_API_KEY=your_api_key_here

    Run in Development mode:
    code Bash

    npm run dev

    Build the application:
    code Bash

    npm run build

⌨️ Shortcuts

    Delete — Remove selected nodes/edges.

    Ctrl + Z / Ctrl + Y — Undo/Redo actions.
