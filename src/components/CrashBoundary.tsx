import { Component, type ReactNode } from 'react';
import { Button } from './ui/button.tsx';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class CrashBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="crash">
        <p className="eyebrow">Glitch</p>
        <h1>The raid glitched.</h1>
        <p>Your saved streak is still on this device.</p>
        <Button size="lg" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    );
  }
}
