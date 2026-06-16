# React TypeScript App (CRA)

This project uses Create React App with TypeScript and is wired to Supabase.

## Supabase setup

1. Create a project in Supabase.
2. Copy your project URL and anon key from Project Settings -> API.
3. Create a local env file:

```bash
cp .env.example .env
```

4. Fill in these variables in .env:

```bash
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
```

Notes:
- The React app connects to Supabase using REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.
- SUPABASE_DB_URL is server-only and should not be used in browser code.
- For your project ref ugyvoqjyeevtitevfcjs, the correct URL is https://ugyvoqjyeevtitevfcjs.supabase.co.

5. Restart the development server after changing env values.

## Supabase migrations from VS Code

Supabase CLI is initialized in this repo (`supabase/config.toml`).

Run these commands in the VS Code terminal:

```bash
npm run supabase:login
npm run supabase:link
npm run supabase:db:push
```

What they do:
- `supabase:login`: Authenticates CLI with your Supabase account.
- `supabase:link`: Connects this repo to your project (`ugyvoqjyeevtitevfcjs`).
- `supabase:db:push`: Applies SQL files in `supabase/migrations/` to that project.

After push, verify table creation:

```sql
select table_schema, table_name
from information_schema.tables
where table_name = 'bookmarks';
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
