# Contributing to QueClaw

Thank you for your interest in contributing to QueClaw! We welcome contributions from everyone.

## Code of Conduct

- Be respectful and inclusive
- No harassment or discrimination
- Focus on constructive feedback
- Help others learn and grow

## How to Contribute

### 1. Report Bugs

Create an issue with:
- Clear, descriptive title
- Reproduction steps
- Expected vs actual behavior
- Environment details (OS, Node/Python versions)
- Screenshots/logs if applicable

### 2. Suggest Features

- Describe the feature and its benefits
- Provide use cases
- Consider backward compatibility
- Link related issues/discussions

### 3. Submit Code

#### Fork & Branch
```bash
# Fork the repository on GitHub
git clone https://github.com/yourusername/queclaw.git
cd queclaw
git checkout -b feature/your-feature-name
```

#### Coding Standards

**JavaScript/TypeScript:**
- Use ESLint configuration provided
- Follow Prettier formatting
- Write clear variable/function names
- Add JSDoc comments for complex logic

**Python:**
- Follow PEP 8 style guide
- Use type hints where possible
- Write docstrings
- Max line length: 88 characters

**General:**
- One feature per pull request
- Small, focused commits
- Descriptive commit messages
- Update documentation

#### Testing

```bash
# Backend
cd backend-node
npm test

# Python
cd ai-engine-python
pytest

# Dashboard
cd dashboard
npm test
```

#### Documentation

- Update README if needed
- Add docstrings to functions
- Update CHANGELOG.md
- Comment complex logic

#### Commit Messages

```
feature: Add image generation command
fix: Fix user query limit bug
docs: Update API documentation
refactor: Simplify auth service
test: Add tests for payment webhook
chore: Update dependencies
```

### 4. Performance Considerations

- Maintain response time < 2 seconds
- Optimize database queries
- Use caching appropriately
- Monitor memory usage
- Test with multiple concurrent users

## Pull Request Process

1. **Update from main**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Push your changes**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request**
   - Clear title and description
   - Reference related issues (#123)
   - Describe changes and testing
   - Include screenshots if UI changes

4. **Code Review**
   - Address feedback promptly
   - Discuss concerns respectfully
   - No push-backs without reason
   - CI/CD must pass

5. **Merge**
   - Squash commits if requested
   - Delete branch after merge
   - Update related issues

## Development Setup

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.

### Backend Development
```bash
cd backend-node
npm install
npm run dev  # Starts with nodemon
```

### Python Development
```bash
cd ai-engine-python
source venv/bin/activate  # or: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Dashboard Development
```bash
cd dashboard
npm install
npm run dev  # Starts on port 3000
```

## Project Structure

```
src/
├── backend-node/     # Express.js API
├── ai-engine-python/ # FastAPI server
└── dashboard/        # Next.js frontend
```

## Testing Requirements

- **Backend**: >70% coverage, all critical paths
- **Python**: Unit tests for AI providers
- **Dashboard**: Component tests for pages
- **Integration**: E2E tests for workflows

## Performance Standards

- API response time: < 500ms
- Database queries: < 100ms
- AI response time: < 30s with timeout
- Bundle size: < 500KB (gzipped)

## Security Guidelines

- Never commit secrets/credentials
- Use environment variables (see .env.example)
- Validate all user inputs
- Sanitize database queries
- Use security headers (Helmet.js)
- Regular dependency audits

## Documentation Standards

- Comment "why", not "what"
- Keep README up-to-date
- Document breaking changes
- Add examples for complex features
- Update ARCHITECTURE.md if structure changes

## Release Process

1. Create release branch: `release/v1.2.3`
2. Update version numbers in package.json
3. Update CHANGELOG.md
4. Create GitHub release with tags
5. CI/CD deploys automatically

## Communication

- **Issues**: Bug reports, feature requests
- **Discussions**: Questions, ideas
- **PRs**: Code reviews
- **Email**: support@queclaw.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Check existing issues/discussions
- Read ARCHITECTURE.md
- See detailed README files
- Open a discussion

## Thank You!

We appreciate all contributions, from code to documentation to suggestions.

Happy coding! 🚀
