# Git & GitHub Workflow Guide

This guide will walk you through the steps to properly contribute your code to the project. Let’s keep everything clean, organized, and conflict-free!

---

## 💻 **Step 1: Get the Project on Your Local Machine**
Run this command in your terminal once to copy the repository to your computer:

```bash
git clone https://github.com/jhonroyilao/im-final-project.git
cd im-final-project
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


