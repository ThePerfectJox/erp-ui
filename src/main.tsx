import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
/* The component library's theme: design tokens, base element styles, and the
 * visually-hidden helper. Imported here, before App, so the tokens are at the head
 * of the cascade and every component stylesheet loaded later can override on top of
 * them rather than under them.
 *
 * This is the whole of the application's global CSS. There is no src/index.css any
 * more — it held the design tokens, which belong to the library rather than to this
 * app, and moving them inside erp-ui-components is what makes that folder copyable
 * on its own. */
import './erp-ui-components/styles/index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</StrictMode>
)
