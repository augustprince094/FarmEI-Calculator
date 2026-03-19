# FarmEI Estimator | Sustainable Agriculture

This is a Next.js application built in Firebase Studio for estimating farm emission intensities for broilers and swine using mass balance calculations and experimental laboratory data.

## Getting Started

To get started with development:
1. Review the logic in `src/lib/calculations.ts`.
2. Explore the UI components in `src/components/calculator/`.
3. Check out the AI integration in `src/ai/ai-scenario-analysis.ts`.

## Pushing to GitHub

To push this project to your own GitHub repository, follow these steps in your terminal:

1. **Create a new repository** on [GitHub](https://github.com/new). Do not initialize it with a README or license.
2. **Initialize Git** (if not already initialized):
   ```bash
   git init
   ```
3. **Add your files**:
   ```bash
   git add .
   ```
4. **Commit your changes**:
   ```bash
   git commit -m "Initial commit of FarmEI Estimator"
   ```
5. **Rename your branch** to `main`:
   ```bash
   git branch -M main
   ```
6. **Add the remote repository URL** (replace `<USERNAME>` and `<REPO>` with your details):
   ```bash
   git remote add origin https://github.com/<USERNAME>/<REPO>.git
   ```
7. **Push to GitHub**:
   ```bash
   git push -u origin main
   ```

## Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS & ShadCN UI
- **AI**: Genkit with Google Gemini
- **Database/Auth**: Firebase (Optional)
