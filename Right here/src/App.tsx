import { Theme } from './settings/types';
import { SponsorshipPortal } from './components/generated/SponsorshipPortal';

let theme: Theme = 'light';

function App() {
  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme);

  return <SponsorshipPortal />;
}

export default App;
