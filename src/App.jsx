import { Routes, Route } from "react-router-dom";
import { SupabaseProvider } from "./contexts/SupabaseContext.jsx";
import Home from "./pages/Home.jsx";
import Anomia from "./pages/Anomia.jsx";

// Imposter
import ModeSelect from "./pages/imposter/ModeSelect.jsx";
import CategorySelect from "./pages/imposter/CategorySelect.jsx";
import PlayerCount from "./pages/imposter/PlayerCount.jsx";
import CardReveal from "./pages/imposter/CardReveal.jsx";
import StartScreen from "./pages/imposter/StartScreen.jsx";

// Imposter Online
import OnlineMenu from "./pages/online/OnlineMenu.jsx";
import OnlineCreate from "./pages/online/OnlineCreate.jsx";
import OnlineJoin from "./pages/online/OnlineJoin.jsx";
import OnlineLobby from "./pages/online/OnlineLobby.jsx";
import OnlineCard from "./pages/online/OnlineCard.jsx";
import OnlineStart from "./pages/online/OnlineStart.jsx";

// Trivia Buzz
import TriviaOnlineMenu from "./pages/trivia/OnlineMenu.jsx";
import TriviaOnlineCreate from "./pages/trivia/OnlineCreate.jsx";
import TriviaOnlineJoin from "./pages/trivia/OnlineJoin.jsx";
import TriviaOnlineLobby from "./pages/trivia/OnlineLobby.jsx";
import TriviaHostBoard from "./pages/trivia/HostBoard.jsx";
import TriviaPlayerBoard from "./pages/trivia/PlayerBoard.jsx";

// Number Guess
import NumGuessModeSelect from "./pages/numguess/ModeSelect.jsx";
import NumGuessLocalSetup from "./pages/numguess/LocalSetup.jsx";
import NumGuessLocalPlay from "./pages/numguess/LocalPlay.jsx";
import NumGuessOnlineMenu from "./pages/numguess/OnlineMenu.jsx";
import NumGuessOnlineCreate from "./pages/numguess/OnlineCreate.jsx";
import NumGuessOnlineJoin from "./pages/numguess/OnlineJoin.jsx";
import NumGuessOnlineLobby from "./pages/numguess/OnlineLobby.jsx";
import NumGuessOnlinePlay from "./pages/numguess/OnlinePlay.jsx";
import NumGuessOnlineResult from "./pages/numguess/OnlineResult.jsx";

export default function App() {
  return (
    <SupabaseProvider>
      <div className="scanlines min-h-dvh">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/anomia" element={<Anomia />} />

          {/* Imposter: Mode → Local (Category → Players → Cards) or Online */}
          <Route path="/imposter" element={<ModeSelect />} />
          <Route path="/imposter/local" element={<CategorySelect />} />
          <Route path="/imposter/local/players" element={<PlayerCount />} />
          <Route path="/imposter/cards" element={<CardReveal />} />
          <Route path="/imposter/start" element={<StartScreen />} />

          {/* Imposter Online */}
          <Route path="/imposter/online" element={<OnlineMenu />} />
          <Route path="/imposter/online/create" element={<OnlineCreate />} />
          <Route path="/imposter/online/join" element={<OnlineJoin />} />
          <Route path="/imposter/online/lobby" element={<OnlineLobby />} />
          <Route path="/imposter/online/card" element={<OnlineCard />} />
          <Route path="/imposter/online/start" element={<OnlineStart />} />

          {/* Trivia Buzz */}
          <Route path="/trivia" element={<TriviaOnlineMenu />} />
          <Route path="/trivia/create" element={<TriviaOnlineCreate />} />
          <Route path="/trivia/join" element={<TriviaOnlineJoin />} />
          <Route path="/trivia/lobby" element={<TriviaOnlineLobby />} />
          <Route path="/trivia/host" element={<TriviaHostBoard />} />
          <Route path="/trivia/play" element={<TriviaPlayerBoard />} />

          {/* Number Guess: Mode → Local or Online */}
          <Route path="/numguess" element={<NumGuessModeSelect />} />
          <Route path="/numguess/local/setup" element={<NumGuessLocalSetup />} />
          <Route path="/numguess/local/play" element={<NumGuessLocalPlay />} />
          <Route path="/numguess/online" element={<NumGuessOnlineMenu />} />
          <Route path="/numguess/online/create" element={<NumGuessOnlineCreate />} />
          <Route path="/numguess/online/join" element={<NumGuessOnlineJoin />} />
          <Route path="/numguess/online/lobby" element={<NumGuessOnlineLobby />} />
          <Route path="/numguess/online/play" element={<NumGuessOnlinePlay />} />
          <Route path="/numguess/online/result" element={<NumGuessOnlineResult />} />
        </Routes>
      </div>
    </SupabaseProvider>
  );
}
