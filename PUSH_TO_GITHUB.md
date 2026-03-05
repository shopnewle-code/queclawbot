# 🚀 Push QueClaw to GitHub

## ✅ YAML Error Fixed!
Fixed the CodeQL workflow error in `.github/workflows/build.yml` (line 142)
- Changed: `languages: ['javascript', 'python']`
- To: Proper YAML list format

## 📝 Git Installation Instructions

### If Git is not installed:

**Option 1: Download Git Installer (Recommended)**
1. Go to https://git-scm.com/download/win
2. Download the latest Git for Windows installer
3. Run the installer → Click "Next" through all steps
4. Restart PowerShell/Terminal after installation

**Option 2: Manual Install (If Chocolatey fails)**
```powershell
# Use Windows Package Manager (winget)
winget install Git.Git
```

**Option 3: GitHub Desktop**
- Download from https://desktop.github.com/
- Includes Git automatically

---

## 🔑 Configure Git (First Time Only)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@gmail.com"
```

---

## 📤 Push to GitHub

Replace `your-token` with your GitHub Personal Access Token:

```powershell
# Navigate to project
cd "c:\Users\arceu\OneDrive\Desktop\Queclaw"

# Initialize (only if not already done)
git init

# Add all files
git add .

# Create commit
git commit -m "Initial commit: QueClaw AI Bot SaaS Platform

- Telegram bot with 8 commands
- Python FastAPI AI engine
- Next.js admin dashboard
- PayPal subscription system
- GitHub Actions CI/CD
- Production-ready"

# Add remote to your repository
git remote add origin https://github.com/shopnewle-code/queclawbot.git

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

When prompted:
- **Username:** your GitHub username
- **Password:** Your Personal Access Token (NOT your password)

---

## 🔑 Get GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: "QueClaw Push"
4. Select scopes:
   - ✅ repo (Full control of private repositories)
   - ✅ workflow
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again!)
7. Use this token as password when pushing

---

## ✅ After Pushing

**Verify on GitHub:**
```powershell
# Check remote
git remote -v

# Check log
git log --oneline -5
```

**Then go to:** https://github.com/shopnewle-code/queclawbot

Should see:
- ✅ All files uploaded
- ✅ Initial commit
- ✅ All folders (backend-node, dashboard, ai-engine-python)
- ✅ All documentation files

---

## 🐛 Troubleshooting

### "git: command not found"
→ Git is not installed. Follow installation steps above.

### "fatal: not a git repository"
```powershell
git init
```

### "fatal: destination path 'c:\...' already exists"
Git repo already initialized locally. Just push:
```powershell
git push -u origin main
```

### Authentication fails
→ Use Personal Access Token instead of password

### "The current branch main has no upstream branch"
```powershell
git push -u origin main
```

---

## 📊 Your Repository

**Repository URL:** https://github.com/shopnewle-code/queclawbot

**What will be uploaded:**
- ✅ 3 main components (backend, AI engine, dashboard)
- ✅ 7 documentation files
- ✅ GitHub Actions CI/CD workflows
- ✅ Configuration files (.env.example, .gitignore, etc.)
- ✅ 420+ npm packages config (package.json)
- ✅ Python dependencies (requirements.txt)

---

## 🎯 Next Steps After Upload

1. ✅ Verify files on GitHub
2. ⏳ GitHub Actions will run tests automatically
3. ⏳ Set up GitHub Secrets for deployments
4. ⏳ Enable branch protection on main
5. ⏳ Deploy to Heroku (backend) and Vercel (dashboard)

---

**Need help?** Follow the steps above in order. Most common issue is just installing Git!
