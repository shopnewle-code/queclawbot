# GitHub Setup Guide

## Step-by-Step Instructions to Upload QueClaw to GitHub

### 1. **Create GitHub Repository**

1. Go to [github.com](https://github.com)
2. Click the **+** icon in the top right → **New repository**
3. Repository name: `queclaw` (or your preferred name)
4. Description: `AI Bot SaaS Platform with Telegram Integration`
5. Choose **Public** or **Private**
6. Do NOT initialize with README (we already have one)
7. Click **Create repository**

### 2. **Copy Repository URL**

After creation, you'll see the HTTPS URL like:
```
https://github.com/yourusername/queclaw.git
```

### 3. **Initialize Git (One-Time Setup)**

Open PowerShell/CMD in the project root:

```powershell
# Configure Git globally (first time only)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Navigate to project
cd "c:\Users\arceu\OneDrive\Desktop\Queclaw"

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: QueClaw AI Bot SaaS Platform"

# Add remote repository
git remote add origin https://github.com/yourusername/queclaw.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### 4. **Authenticate with GitHub**

When pushing, you'll be prompted to authenticate. Choose **one** method:

#### Option A: Personal Access Token (Recommended)

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` scope
3. Copy the token
4. When prompted, paste the token as the password

#### Option B: SSH Keys

1. Generate SSH key:
```powershell
ssh-keygen -t rsa -b 4096 -C "your.email@example.com"
```

2. Add to GitHub SSH keys:
   - Go to GitHub Settings → SSH and GPG keys
   - Add new key, paste contents of `id_rsa.pub`

3. Use SSH URL: `git@github.com:yourusername/queclaw.git`

### 5. **Update Remote if Needed**

If you need to change the remote URL:

```powershell
git remote set-url origin https://github.com/yourusername/queclaw.git
```

### 6. **Verify Upload**

```powershell
# Check remote
git remote -v

# Show commit log
git log --oneline -5

# Check branch
git branch -a
```

## Subsequent Updates

After initial setup, use these commands:

```powershell
# Make changes, then:
git add .
git commit -m "Your commit message"
git push origin main
```

## Branch Strategy

```powershell
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push feature branch
git push origin feature/new-feature

# Create Pull Request on GitHub
# After review and merge, delete local branch:
git branch -d feature/new-feature
```

## Common Commands

```powershell
# Check status
git status

# View changes
git diff

# View commit history
git log --oneline

# Undo last commit (unpushed)
git reset --soft HEAD~1

# Create new branch
git checkout -b branch-name

# Switch branch
git checkout branch-name

# View all branches
git branch -a

# Delete branch
git branch -d branch-name
```

## Troubleshooting

### "fatal: not a git repository"
```powershell
git init
```

### "Permission denied (publickey)"
- Check SSH key setup
- Or use HTTPS instead

### "remote origin already exists"
```powershell
git remote remove origin
git remote add origin <new-url>
```

### Push rejected - behind remote
```powershell
git pull origin main --rebase
git push origin main
```

## File Structure on GitHub

Your repository will have this structure:

```
queclaw/
├── backend-node/
│   ├── config/
│   ├── handlers/
│   ├── services/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── middleware/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── ai-engine-python/
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── dashboard/
│   ├── pages/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── styles/
│   ├── public/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── README.md
├── QUICKSTART.md
├── README.md
├── .gitignore
└── GITHUB_SETUP.md (this file)
```

## GitHub Features to Enable

### 1. **Add Topics**
Settings → Topics → Add: `ai`, `bot`, `telegram`, `saas`, `next`, `node`

### 2. **Enable Wiki**
Settings → Features → Wiki ✓

### 3. **Enable Discussions**
Settings → Features → Discussions ✓

### 4. **Add GitHub Actions** (CI/CD)

Create `.github/workflows/build.yml`:

```yaml
name: Build & Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

### 5. **Add LICENSE**

Create `LICENSE` file with MIT license text.

### 6. **Add Badges to README**

```markdown
![Build Status](https://github.com/yourusername/queclaw/workflows/Build%20&%20Test/badge.svg)
![Followers](https://img.shields.io/github/followers/yourusername)
![Stars](https://img.shields.io/github/stars/yourusername/queclaw)
```

## Setting Up .env for Security

**IMPORTANT**: Never commit `.env` files!

1. Create `.env.example` with dummy values:
```env
TELEGRAM_TOKEN=your_token_here
PAYPAL_CLIENT_ID=your_client_id
MONGODB_URI=your_mongodb_uri
```

2. Users can copy and fill in:
```bash
cp .env.example .env
```

3. The `.gitignore` already excludes `.env`

## Automating Deployment

### Deploy to Heroku from GitHub

1. Go to Heroku Dashboard
2. Create new app
3. Connect GitHub repo
4. Enable auto-deploy on push to `main`
5. Set environment variables in Settings → Config Vars

### Deploy to Vercel (Dashboard only)

1. Connect GitHub to Vercel
2. Select `dashboard` folder
3. Set environment variables
4. Deploy!

## Rate Limiting

GitHub has rate limits:
- 60 requests/hour (unauthenticated)
- 5,000 requests/hour (authenticated)
- Use personal access token for higher limits

## Collaboration

### Adding Collaborators
1. Settings → Collaborators → Add people
2. Choose permissions (Push, Maintain, Admin)

### Protected Branches
1. Settings → Branches
2. Add rule for `main` branch
3. Require PR reviews before merge
4. Require status checks to pass

## Monitoring

- **Issues**: For bug tracking
- **Projects**: For task management
- **Releases**: For version management
- **Actions**: For CI/CD status

## Next Steps

1. ✅ Upload to GitHub
2. ✅ Add collaborators if needed
3. ✅ Enable protected main branch
4. ✅ Set up CI/CD
5. ✅ Deploy to hosting platform
6. ✅ Monitor and iterate

---

**For questions, see**: https://docs.github.com/en/get-started
