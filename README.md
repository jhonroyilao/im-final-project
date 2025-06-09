# Project Workflow Guide

This document outlines the folder structure of the **CCIS Lab System**, a web application built using **Next.js 13+** and **TypeScript**.

---

### Prerequisites

- Node.js 16.8 or later
- npm or pnpm
---
## 📦 Project Directory

```text
ccis-lab-system/
├── app/                 # Next.js 13+ app directory
├── components/          # React components
│   ├── pages/           # Page-specific components
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components
│   ├── calendar/        # Calendar-related components
│   └── reservation/     # Reservation-related components
├── public/              # Static assets
├── styles/              # Global styles
├── lib/                 # Utility functions
├── hooks/               # Custom React hooks
└── types/               # TypeScript type definitions

```
---
## 💻 **Step 1: Get the Project on Your Local Machine**
Run this command in your terminal once to copy the repository to your computer:

```bash
git clone https://github.com/jhonroyilao/im-final-project.git
cd im-final-project
```

Install dependencies:
```bash
npm install
# or
pnpm install
```
Run the development server:
```bash
npm run dev
# or
pnpm dev
```
---

## 🌿 **Step 2: Create your own branch**
```bash
git checkout -b roy-branch
```

## 👌 **Step 3: Make Your Edits**
1. Work on your assigned files
2. Add new files or folders as needed
3. Keep your code neat and organized
---

## 🦾 **Step 4: Save and Commit Your Changes**
```bash
git add .
git commit -m "Short message about what you changed"
Tip: Use clear commit messages like "Implemented responsive layout for homepage"
```
---

## 📨 **Step 5: Push Your Work Online**
```bash
git push origin your-branch-name
```
---

## 📝 **Step 6: Create a Pull Request**
  1. Go to the GitHub repo: https://github.com/jhonroyilao/im-final-project
  2. Click on the "Compare & pull request" button
  3. Add a description of your changes
  4. Submit the pull request


## 🔀 **Merge / Pull the latest version of Main branch**
```bash
git checkout main
git pull origin main
git checkout roy-branch
git merge main
```



