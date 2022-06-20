import * as React from "react";
import { Container } from "./Container";

export const App = () => (
  <ul className="menu">
    <li className="status">&nbsp;</li>
    <li className="separator"></li>
    <li>
      <ul className="containers">
        {[0, 1, 2].map(() => (
          <Container key={Math.random()} />
        ))}
      </ul>
    </li>
    <li className="separator"></li>
    <li
      className="action autoLaunch"
      onClick={
        // @ts-ignore
        () => window.toggleAutoLaunch()
      }
    >
      Start Captain at Login
    </li>
    <li
      className="action"
      onClick={
        // @ts-ignore
        () => window.checkForUpdates()
      }
    >
      Check for Updates...
    </li>
    <li
      className="action"
      onClick={
        // @ts-ignore
        () => window.clientStop()
      }
    >
      Quit Captain <span className="shortcut">⌘Q</span>
    </li>
  </ul>
);
